#!/usr/bin/env python3
"""
Re-pack + clean + pixelate the raw character art into a game-ready sprite sheet.

The source art (AI-generated) is an irregular grid (sprite columns at ~150px
pitch, not 1024/6) and is painterly/soft with neighbour bleed when cropped.
This script:
  1. Crops fixed cells centred on the real sprite positions.
  2. Isolates the main sprite per cell via connected-components, deleting any
     fragment that doesn't reach the cell centre (kills neighbour bleed).
  3. Downscales + quantises to a limited palette with hard alpha edges, so it
     reads as crisp pixel-art (the game upscales it nearest-neighbour).

Output: clean uniform 6-col x 5-row sheet (idle, fly, fly2, hurt, cheer).

Usage: python3 scripts/build-character.py "/path/to/raw.png"
"""
import sys
from collections import deque
from PIL import Image

DEFAULT_SRC = "/Users/rama/Downloads/ChatGPT Image 24 jun 2026, 09_18_10 a.m..png"
OUT = "public/assets/character.png"

COL_CENTERS = [121, 265, 416, 565, 718, 870]
ROW_CENTERS = [123, 337, 546, 762, 984]  # idle, fly, fly2, hurt, cheer
CELL_W, CELL_H = 168, 210

ALPHA_SOLID = 40       # pixels above this count as part of a sprite
MIN_BLOB = 12          # drop specks smaller than this
BAND = 0.18            # central horizontal band a real sprite must reach
DOWNSCALE = 3.5        # 168/3.5=48, 210/3.5=60  -> chunky pixels
PALETTE_COLORS = 32
ALPHA_CUT = 110        # hard edge threshold after downscale


def isolate(cell: Image.Image) -> Image.Image:
    """Keep only connected blobs that reach the cell's central band."""
    w, h = cell.size
    px = cell.load()
    solid = [[px[x, y][3] > ALPHA_SOLID for x in range(w)] for y in range(h)]
    seen = [[False] * w for _ in range(h)]
    keep = [[False] * w for _ in range(h)]
    band_l, band_r = int(BAND * w), int((1 - BAND) * w)

    for y0 in range(h):
        for x0 in range(w):
            if not solid[y0][x0] or seen[y0][x0]:
                continue
            q = deque([(x0, y0)])
            seen[y0][x0] = True
            blob = []
            touches = False
            while q:
                x, y = q.popleft()
                blob.append((x, y))
                if band_l <= x <= band_r:
                    touches = True
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and solid[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        q.append((nx, ny))
            if touches and len(blob) >= MIN_BLOB:
                for (x, y) in blob:
                    keep[y][x] = True

    out = cell.copy()
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if not keep[y][x]:
                r, g, b, _ = opx[x, y]
                opx[x, y] = (r, g, b, 0)
    return out


def pixelate(sheet: Image.Image) -> Image.Image:
    """Downscale, quantise to a small palette, and harden alpha edges."""
    sw, sh = sheet.size
    small = sheet.resize((round(sw / DOWNSCALE), round(sh / DOWNSCALE)), Image.LANCZOS)
    r, g, b, a = small.split()
    a = a.point(lambda v: 255 if v >= ALPHA_CUT else 0)
    rgb = Image.merge("RGB", (r, g, b))
    pal = rgb.quantize(colors=PALETTE_COLORS, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
    pr, pg, pb = pal.split()
    return Image.merge("RGBA", (pr, pg, pb, a))


def main() -> None:
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
    im = Image.open(src).convert("RGBA")
    cols, rows = len(COL_CENTERS), len(ROW_CENTERS)

    sheet = Image.new("RGBA", (CELL_W * cols, CELL_H * rows), (0, 0, 0, 0))
    for r, cy in enumerate(ROW_CENTERS):
        for c, cx in enumerate(COL_CENTERS):
            x0, y0 = cx - CELL_W // 2, cy - CELL_H // 2
            cell = isolate(im.crop((x0, y0, x0 + CELL_W, y0 + CELL_H)))
            sheet.paste(cell, (c * CELL_W, r * CELL_H))

    final = pixelate(sheet)
    final.save(OUT)
    print(f"wrote {OUT} {final.size} (cell {final.size[0]//cols}x{final.size[1]//rows})")


if __name__ == "__main__":
    main()
