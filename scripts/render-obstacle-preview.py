#!/usr/bin/env python3
"""[OBS-008] Offline preview of obstacle walls.

Faithfully replays the in-engine 3-slice composition (TextureFactory.slice +
Barrier.placeSide) against the packed atlas so we can eyeball every obstacle
type as a real left/right wall pair with the central gap, on the night sky.

This is a documentation/QA aid, NOT part of the build. Run:
    source .venv/bin/activate && python scripts/render-obstacle-preview.py
Output: docs/obs-008/modular-walls.png
"""
from __future__ import annotations
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ATLAS = os.path.join(ROOT, "public", "assets", "obstacles.png")
OUT = os.path.join(ROOT, "docs", "obs-008", "modular-walls.png")

# Mirror src/config/GameConfig OBSTACLE_CFG + Barrier constants.
CAP_FRACTION = 0.32
BAND = 88          # Barrier.bandHeight
GAME_WIDTH = 540
CENTER_ALPHA = 0.78
FILL_ALPHA = 0.55

# Mirror src/config/Constants OBSTACLE_FRAMES (name -> rect, centerX absolute).
FRAMES = [
    ("blue_bar",      2,   2, 125, 88, 64),
    ("green_bar",     129, 2, 125, 88, 191),
    ("purple_pillar", 256, 2, 125, 88, 318),
    ("red_arrow",     383, 2, 125, 88, 445),
    ("red_spike",     2,  92, 125, 88, 64),
    ("stone_crack",   510, 92, 125, 88, 572),
    ("blue_tile",     637, 92, 125, 88, 699),
    ("gold_block",    2, 182, 125, 88, 64),
]

# Mirror src/config/ObstacleTypes OBSTACLE_TYPES[*].fill (brand hues).
FILL = {
    "blue_bar": 0x0CA8D8, "green_bar": 0x30CCA8, "purple_pillar": 0x903C78,
    "red_arrow": 0xF02430, "red_spike": 0xE40C24, "stone_crack": 0x84849C,
    "blue_tile": 0x7722EE, "gold_block": 0xFCA800,
}

NIGHT = (24, 28, 64)   # representative twilight/night sky behind walls


def hex_rgb(v: int) -> tuple[int, int, int]:
    return ((v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF)


def slice_frame(atlas: Image.Image, x: int, y: int, w: int, h: int, center_abs: int):
    """Reproduce TextureFactory.slice: _l/_r caps + 1px _c body column."""
    cap_w = max(8, round(w * CAP_FRACTION))
    frame = atlas.crop((x, y, x + w, y + h))
    left = frame.crop((0, 0, cap_w, h))
    right = frame.crop((w - cap_w, 0, w, h))
    cx = center_abs - x
    center = frame.crop((cx, 0, cx + 1, h))
    return left, right, center, cap_w


def tile_body(col: Image.Image, width: int, height: int) -> Image.Image:
    """Repeat the 1px body column to `width`, scaled to `height` (tileScale)."""
    col = col.resize((1, height), Image.NEAREST)
    body = Image.new("RGBA", (max(1, width), height))
    for i in range(max(1, width)):
        body.paste(col, (i, 0))
    return body


def alpha_blend(dst: Image.Image, src: Image.Image, x: int, y: int, mul: float):
    s = src.copy()
    a = s.getchannel("A").point(lambda v: int(v * mul))
    s.putalpha(a)
    dst.alpha_composite(s, (x, y))


def render_wall(canvas: Image.Image, atlas, frame, x0: int, x1: int, cap_at_right: bool, yc: int):
    name, ax, ay, w, h, cabs = frame
    left, right, center, _ = slice_frame(atlas, ax, ay, w, h, cabs)
    tile_scale = BAND / h
    cap_px = max(8, round(w * CAP_FRACTION))
    cap_display_w = round(cap_px * tile_scale)
    width = x1 - x0
    cap_w = min(cap_display_w, width)
    center_w = width - cap_w
    top = yc - BAND // 2
    fill_rgb = hex_rgb(FILL[name])

    cap_img = (right if cap_at_right else left).resize((cap_w, BAND), Image.NEAREST)

    if cap_at_right:
        body_x = x0
        cap_x = x1 - cap_w
    else:
        body_x = x0 + cap_w
        cap_x = x0

    if center_w > 1:
        # fill backing rect at 0.55, then tiled body column at 0.78
        backing = Image.new("RGBA", (center_w, BAND), fill_rgb + (int(255 * FILL_ALPHA),))
        canvas.alpha_composite(backing, (body_x, top))
        body = tile_body(center, center_w, BAND)
        alpha_blend(canvas, body, body_x, top, CENTER_ALPHA)

    canvas.alpha_composite(cap_img, (cap_x, top))


def main():
    atlas = Image.open(ATLAS).convert("RGBA")
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 18)
    except Exception:
        font = ImageFont.load_default()

    row_h = BAND + 36
    pad = 16
    canvas = Image.new("RGBA", (GAME_WIDTH, pad + len(FRAMES) * row_h + pad), NIGHT + (255,))
    draw = ImageDraw.Draw(canvas)

    gap_w = 150
    gap_l = (GAME_WIDTH - gap_w) // 2
    gap_r = gap_l + gap_w

    y = pad
    for frame in FRAMES:
        name = frame[0]
        yc = y + 18 + BAND // 2
        # left wall: cap faces right (toward gap)
        render_wall(canvas, atlas, frame, 0, gap_l, True, yc)
        # right wall: cap faces left (toward gap)
        render_wall(canvas, atlas, frame, gap_r, GAME_WIDTH, False, yc)
        draw.text((6, y + 2), name, fill=(255, 255, 255, 230), font=font)
        y += row_h

    canvas.convert("RGB").save(OUT)
    print(f"wrote {OUT} ({canvas.width}x{canvas.height})")


if __name__ == "__main__":
    main()
