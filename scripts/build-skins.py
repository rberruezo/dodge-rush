#!/usr/bin/env python3
"""
Build alternate character skins into the SAME 6x7 / 120px grid as the main
character (public/assets/character.png), so they're drop-in swappable.

Each source sheet is a uniform grid on a white background. We crop each cell,
remove the white background (edge flood-fill, keeping enclosed white fur),
isolate the central sprite, normalise to a consistent size, and place it into
our category layout via ROW_MAP:
  out rows = [hover, move, move_hard, boost, cheer, combo, specials]
The `specials` source row must be [dizzy, cloud, trophy, crown, star-head,
cry-head] to match the game's feedback frames.
"""
from collections import deque
from PIL import Image, ImageFilter

WINDOW = 176
CELL = 120
OUT_COLS, OUT_ROWS = 6, 7
PRE_SMOOTH = 3
PALETTE_COLORS = 40
ALPHA_CUT = 115
NORM_H = 132
NORM_W = 150

# out-category order -> source row index
# out-category order = [hover, move, move_hard, boost, cheer, combo, specials].
# The game's facing logic expects move/move_hard art to face LEFT and the rest
# (hover/boost/combo) to face RIGHT. These source sheets vary per row, so each
# sheet lists which OUTPUT rows to horizontally flip to match that convention.
SHEETS = [
    {
        'src': '/Users/rama/Downloads/Gemini_Generated_Image_ai2qqlai2qqlai2q.png',
        'out': 'public/assets/character_cat.png',
        'cols': 6, 'rows': 7,
        'row_map': [1, 0, 2, 3, 4, 5, 6],
        # cat: hover(0) faces left + move/move_hard(1,2) face right -> flip all three
        'flip': {0, 1, 2},
    },
    {
        'src': '/Users/rama/Downloads/Gemini_Generated_Image_42wiqe42wiqe42wi.png',
        'out': 'public/assets/character_unicorn.png',
        'cols': 6, 'rows': 5,
        'row_map': [2, 0, 1, 0, 3, 3, 4],
        # unicorn: hover already faces right; only move/move_hard need flipping
        'flip': {1, 2},
    },
    {
        'src': '/Users/rama/Downloads/Gemini_Generated_Image_ah3muaah3muaah3m.png',
        'out': 'public/assets/character_phoenix.png',
        'cols': 6, 'rows': 7,
        # src rows: 0 sideflight, 1 sideflight(calm), 2 sideflight, 3 sparkle/boost,
        # 4 cheer(front), 5 combo(front), 6 specials. Map hover<-1, move<-0, hard<-2.
        'row_map': [1, 0, 2, 3, 4, 5, 6],
        # source flight poses face RIGHT; game wants move/move_hard facing LEFT,
        # and hover<-src1 needs flipping too -> flip hover+move+move_hard+boost.
        'flip': {0, 1, 2, 3},
    },
    {
        'src': '/Users/rama/Downloads/Gemini_Generated_Image_166uap166uap166u.png',
        'out': 'public/assets/character_witch.png',
        'cols': 6, 'rows': 7,
        # witch on a broom; every row already in the game's category order, and
        # row 6 already matches the specials slots (sad/think/trophy/crown/star/cry).
        'row_map': [0, 1, 2, 3, 4, 5, 6],
        # all poses face LEFT; move/move_hard stay, the rest must face RIGHT.
        'flip': {0, 3, 4, 5, 6},
    },
    {
        'src': '/Users/rama/Downloads/Gemini_Generated_Image_61rfwz61rfwz61rf.png',
        'out': 'public/assets/character_wizard.png',
        'cols': 6, 'rows': 7,
        # rows already in category order; row 6 matches the specials slots.
        # Per-row natural facing varies: src0/1/3/4/5/6 face RIGHT, src2 faces
        # LEFT. Game wants move(1)+move_hard(2) LEFT -> only src1 needs flipping.
        # NOTE: re-download the source to this path to rebuild (it was removed).
        'row_map': [0, 1, 2, 3, 4, 5, 6],
        'flip': {1},
    },
]


def is_bg(r, g, b):
    return min(r, g, b) > 175 and (max(r, g, b) - min(r, g, b)) < 45


def extract(cell):
    """White-background removal (edge flood-fill) + keep the central blob."""
    w, h = cell.size
    px = cell.load()
    ext = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(*px[x, y][:3]) and not ext[y][x]:
                ext[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(*px[x, y][:3]) and not ext[y][x]:
                ext[y][x] = True
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not ext[ny][nx] and is_bg(*px[nx, ny][:3]):
                ext[ny][nx] = True
                q.append((nx, ny))

    seen = [[False] * w for _ in range(h)]
    keep = [[False] * w for _ in range(h)]
    cl, cr = int(0.28 * w), int(0.72 * w)
    ct, cb = int(0.2 * h), int(0.8 * h)
    for y0 in range(h):
        for x0 in range(w):
            if ext[y0][x0] or seen[y0][x0]:
                continue
            blob, touches = [], False
            qq = deque([(x0, y0)])
            seen[y0][x0] = True
            while qq:
                x, y = qq.popleft()
                blob.append((x, y))
                if cl <= x <= cr and ct <= y <= cb:
                    touches = True
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and not ext[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        qq.append((nx, ny))
            if touches and len(blob) >= 60:
                for (x, y) in blob:
                    keep[y][x] = True

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if keep[y][x]:
                r, g, b = px[x, y][:3]
                opx[x, y] = (r, g, b, 255)
    return out


def normalize(cell):
    bbox = cell.getbbox()
    if not bbox:
        return Image.new("RGBA", (WINDOW, WINDOW), (0, 0, 0, 0))
    content = cell.crop(bbox)
    cw, ch = content.size
    scale = NORM_H / ch
    if cw * scale > NORM_W:
        scale = NORM_W / cw
    nw, nh = max(1, round(cw * scale)), max(1, round(ch * scale))
    content = content.resize((nw, nh), Image.LANCZOS)
    out = Image.new("RGBA", (WINDOW, WINDOW), (0, 0, 0, 0))
    out.alpha_composite(content, ((WINDOW - nw) // 2, (WINDOW - nh) // 2))
    return out


def pixelate(sheet):
    r, g, b, a = sheet.split()
    rgb = Image.merge("RGB", (r, g, b)).filter(ImageFilter.MedianFilter(PRE_SMOOTH))
    sm = Image.merge("RGBA", (*rgb.split(), a))
    small = sm.resize((OUT_COLS * CELL, OUT_ROWS * CELL), Image.LANCZOS)
    sr, sg, sb, sa = small.split()
    pal = Image.merge("RGB", (sr, sg, sb)).quantize(
        colors=PALETTE_COLORS, method=Image.MEDIANCUT, dither=Image.NONE
    ).convert("RGB")
    pr, pg, pb = pal.split()
    hard_a = sa.point(lambda v: 255 if v >= ALPHA_CUT else 0)
    return Image.merge("RGBA", (pr, pg, pb, hard_a))


def build(cfg):
    im = Image.open(cfg['src']).convert("RGBA")
    W, H = im.size
    cw, ch = W / cfg['cols'], H / cfg['rows']
    big = Image.new("RGBA", (OUT_COLS * WINDOW, OUT_ROWS * WINDOW), (0, 0, 0, 0))
    for out_row, src_row in enumerate(cfg['row_map']):
        for col in range(OUT_COLS):
            x0, y0 = round(col * cw), round(src_row * ch)
            cell = im.crop((x0, y0, x0 + round(cw), y0 + round(ch)))
            tile = normalize(extract(cell))
            if out_row in cfg['flip']:
                tile = tile.transpose(Image.FLIP_LEFT_RIGHT)
            big.paste(tile, (col * WINDOW, out_row * WINDOW))
    final = pixelate(big)
    final.save(cfg['out'])
    print(f"wrote {cfg['out']} {final.size}")


import sys

_names = sys.argv[1:]   # optional filter, e.g. `build-skins.py phoenix`
for cfg in SHEETS:
    if _names and not any(n in cfg['out'] for n in _names):
        continue
    build(cfg)
