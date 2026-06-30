#!/usr/bin/env python3
"""Pack modular obstacle pieces (art-src/obstacles/pieces/) into the game atlas
public/assets/obstacles.png and emit the OBSTACLE_FRAMES / OBSTACLE_ANIM_FRAMES
arrays for src/config/Constants.ts.

[OBS-008 / Option B] Each wall is built by the existing 3-slice pipeline:
`_l`/`_r` end-caps (capFraction of the tile) + a 1px seamless body column at
`centerX`. So every packed tile is composed as:

    [ mirrored cap-end | body-column strip | cap-end ]

- cap-end  = the decorated gap-facing terminator, cropped from the *_cap piece
             (right end), sized so capFraction lands exactly on it (no squish).
- body     = the brightest near-opaque on-brand column sampled from the *_center
             piece, repeated across the strip (1px tiled body = zero-seam).
- centerX  = middle of the body strip.

Animated types pack extra frames (capf1, capf2, ...) named `<type>_f<i>`; the
body strip is identical across frames (only the cap animates).

Run: source .venv/bin/activate && python scripts/pack-obstacles.py
"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIECES = os.path.join(ROOT, 'art-src/obstacles/pieces')
ATLAS = os.path.join(ROOT, 'public/assets/obstacles.png')

TH = 88            # tile height == bandHeight (tileScale 1.0 in-engine)
CAP_W = 40         # display width of each end-cap inside the tile
BODY_W = 45        # body strip width -> round(0.32 * 125) == 40 (capFraction fit)
TW = CAP_W * 2 + BODY_W  # 125
CENTER_X_REL = CAP_W + BODY_W // 2  # 62
PAD = 2            # transparent gap between packed tiles

# type -> (center piece, cap base piece, [anim cap frames]); order == atlas order
TYPES = [
    ('blue_bar',      'blue_bar_center',      'blue_bar_cap',      []),
    ('green_bar',     'green_bar_center',     'green_bar_cap',     []),
    ('purple_pillar', 'purple_pillar_center', 'purple_pillar_cap', []),
    ('red_arrow',     'red_arrow_center',     'red_arrow_capf0',   ['red_arrow_capf1', 'red_arrow_capf2']),
    ('red_spike',     'red_spike_center',     'red_spike_capf0',   ['red_spike_capf1', 'red_spike_capf2', 'red_spike_capf3']),
    ('stone_crack',   'stone_crack_center',   'stone_crack_cap',   []),
    ('blue_tile',     'blue_tile_center',     'blue_tile_cap',     []),
    ('gold_block',    'gold_block_center',    'gold_block_capf0',   ['gold_block_capf1', 'gold_block_capf2', 'gold_block_capf3', 'gold_block_capf4']),
]


def load(name):
    return np.array(Image.open(os.path.join(PIECES, name + '.png')).convert('RGBA'))


def scale_to_h(img, h):
    im = Image.fromarray(img, 'RGBA')
    w = max(1, round(im.width * h / im.height))
    return np.array(im.resize((w, h), Image.NEAREST))


def harden(img):
    """force binary alpha; zero RGB where transparent."""
    out = img.copy()
    a = (out[:, :, 3] >= 128)
    out[:, :, 3] = np.where(a, 255, 0)
    out[~a] = 0
    return out


def cap_end(cap_img):
    """rightmost CAP_W px of the cap scaled to TH (the decorated terminator)."""
    s = harden(scale_to_h(cap_img, TH))
    if s.shape[1] >= CAP_W:
        return s[:, s.shape[1] - CAP_W:, :]
    pad = np.zeros((TH, CAP_W - s.shape[1], 4), np.uint8)
    return np.concatenate([pad, s], axis=1)


def body_column(center_img):
    """Real body slice from the sprite's horizontal body panel.

    The *_center pieces are actual horizontal wall bodies (bright top bevel rail
    + interior + dark bottom rail). Their MIDDLE columns are horizontally uniform
    (the bevel runs along the length), so we scale the panel to band height and
    take a BODY_W-wide window from the centre — a real slice of sprite art that
    tiles seamlessly (left edge == right edge) with no auto-generated fill.
    """
    s = harden(scale_to_h(center_img, TH))
    w = s.shape[1]
    if w >= BODY_W:
        x0 = (w - BODY_W) // 2
        strip = s[:, x0:x0 + BODY_W, :].copy()
    else:  # narrow panel: repeat to reach BODY_W
        reps = (BODY_W + w - 1) // w
        strip = np.tile(s, (1, reps, 1))[:, :BODY_W, :].copy()
    return harden(strip)


SEAM_FEATHER = 9  # px: blend the cap's body-facing edge into the body so the
#                   wall reads as ONE continuous panel (body flows into the tip)


def _blend_into_body(cap, body_edge, from_left):
    """Cross-fade the cap's body-facing columns toward the body edge colour.

    The decorated terminator lives on the cap's OUTER (gap-facing) side; only its
    INNER ~SEAM_FEATHER columns get faded so the junction with the tiled body has
    no hard double-bevel seam. `body_edge` is the adjacent body column (TH,1,4).
    """
    out = cap.astype(np.float32).copy()
    be = body_edge.astype(np.float32)[:, 0, :]
    f = min(SEAM_FEATHER, out.shape[1])
    for i in range(f):
        a = i / f  # 0 at the seam -> body colour, 1 -> untouched cap
        col = (f - 1 - i) if from_left else i  # inner column index
        out[:, col, :] = be * (1.0 - a) + out[:, col, :] * a
    return harden(out.astype(np.uint8))


def compose(cap_end_img, body_strip):
    tile = np.zeros((TH, TW, 4), np.uint8)
    body_l = body_strip[:, :1, :]    # body's left edge colour
    body_r = body_strip[:, -1:, :]   # body's right edge colour
    left = cap_end_img[:, ::-1, :]   # mirrored cap faces left; its RIGHT edge meets body
    left = _blend_into_body(left, body_l, from_left=True)
    right = _blend_into_body(cap_end_img, body_r, from_left=False)  # LEFT edge meets body
    tile[:, 0:CAP_W] = left
    tile[:, CAP_W:CAP_W + BODY_W] = body_strip
    tile[:, CAP_W + BODY_W:TW] = right  # cap faces right
    return tile


def main():
    tiles = []  # (frame_name, np_tile, is_anim)
    for name, center, capbase, anim in TYPES:
        body = body_column(load(center))
        base_cap = cap_end(load(capbase))
        tiles.append((name, compose(base_cap, body), False))
        for i, fr in enumerate(anim, start=1):
            tiles.append((f'{name}_f{i}', compose(cap_end(load(fr)), body), True))

    cols = 6
    rows = (len(tiles) + cols - 1) // cols
    AW = cols * TW + (cols + 1) * PAD
    AH = rows * TH + (rows + 1) * PAD
    atlas = np.zeros((AH, AW, 4), np.uint8)
    frames = {}
    for idx, (fname, tile, is_anim) in enumerate(tiles):
        r, c = divmod(idx, cols)
        x = PAD + c * (TW + PAD)
        y = PAD + r * (TH + PAD)
        atlas[y:y + TH, x:x + TW] = tile
        frames[fname] = (x, y, TW, TH, x + CENTER_X_REL, is_anim)

    os.makedirs(os.path.dirname(ATLAS), exist_ok=True)
    Image.fromarray(atlas, 'RGBA').save(ATLAS)
    print(f'wrote {ATLAS} ({AW}x{AH}), {len(tiles)} tiles')

    base = [t[0] for t in TYPES]
    print('\n// ---- paste into src/config/Constants.ts ----')
    print('export const OBSTACLE_FRAMES: ObstacleFrameDef[] = [')
    for n in base:
        x, y, w, h, cx, _ = frames[n]
        print(f"  {{ name: '{n}', x: {x}, y: {y}, width: {w}, height: {h}, centerX: {cx} }},")
    print('];')
    print('\nexport const OBSTACLE_ANIM_FRAMES: ObstacleAnimFrameDef[] = [')
    for fname, (x, y, w, h, cx, is_anim) in frames.items():
        if is_anim:
            print(f"  {{ name: '{fname}', x: {x}, y: {y}, width: {w}, height: {h}, centerX: {cx} }},")
    print('];')

    print('\n// ---- ObstacleTypes.ts animFrames/animMs ----')
    for name, _, _, anim in TYPES:
        if anim:
            print(f'  {name}: animFrames {len(anim) + 1}')


if __name__ == '__main__':
    main()
