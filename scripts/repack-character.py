#!/usr/bin/env python3
"""
Repack an uploaded character sheet into the game's clean 6x8 / 120px grid.

The uploaded art (art-src/character/source-6x8.png) is 6 columns x 8 rows on a
painted grey *checkerboard* background (NOT real alpha), off an exact pixel grid,
with stray text labels under some cells. This script:
  1. Treats it as a uniform 6x8 grid (cell size derived from the image size).
  2. Flood-fills the checkerboard background from each cell's edges -> alpha 0.
  3. Keeps only the central character blob (drops the text labels, which sit in
     the lower band and never touch the cell centre).
  4. Normalises every sprite to a consistent height and centres it.
  5. Re-packs to 6x8 of 120px cells (720x960) with a tight palette + hard alpha.

Frame map (index = row*6 + col) — must match Constants.ts:
  row0 0-5   hover (front)
  row1 6-11  side flight, calm     (faces LEFT)
  row2 12-17 side flight, straining (faces LEFT)
  row3 18-23 boost + sparkles
  row4 24-29 cheer (arms up)
  row5 30-35 combo gestures x1..x20
  row6 36-41 dizzy, sad-cloud, trophy, crown, star-head, sad head
  row7 42-47 death: bonk -> spin -> fall

Usage: python repack-character.py [SOURCE.png]
"""
import sys
from collections import deque
from PIL import Image, ImageFilter

SRC = sys.argv[1] if len(sys.argv) > 1 else "art-src/character/source-6x8.png"
OUT = "public/assets/character.png"

COLS, ROWS = 6, 8
CELL = 120          # output cell (rendered ~1:1 in game)
WINDOW = 150        # extraction window (~one source cell)
PRE_SMOOTH = 3
PALETTE_COLORS = 48
ALPHA_CUT = 115
NORM_H = 112        # normalised content height inside WINDOW (keeps margin)
NORM_W = 134        # width cap for very wide poses
# Fraction of each source cell to keep (crops the label text band off the
# bottom). Rows 6-7 carry text labels; rows 0-5 are clean so keep almost all.
KEEP_DEFAULT = 0.97
KEEP_LABELLED = 0.79  # rows 6-7 (specials, death) — labels live below this


def is_bg(r, g, b):
    """Grey checkerboard: near-neutral hue at mid value (tones ~78 and ~150)."""
    return max(r, g, b) - min(r, g, b) <= 22 and 48 <= (r + g + b) / 3 <= 188


def extract(im, box):
    crop = im.crop(box).convert("RGB")
    w, h = crop.size
    px = crop.load()

    # Flood-fill the background inward from every edge.
    ext = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(*px[x, y]) and not ext[y][x]:
                ext[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(*px[x, y]) and not ext[y][x]:
                ext[y][x] = True
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not ext[ny][nx] and is_bg(*px[nx, ny]):
                ext[ny][nx] = True
                q.append((nx, ny))

    # Keep only foreground blobs that reach the cell centre (drops text labels).
    # The character body sits in the upper-centre of the cell. Requiring blobs to
    # reach this band (not the lower strip) drops both the residual label text and
    # any propeller/dust from the next row that bleeds in via grid misalignment.
    seen = [[False] * w for _ in range(h)]
    keep = [[False] * w for _ in range(h)]
    cl, cr = int(0.28 * w), int(0.72 * w)
    ct, cb = int(0.10 * h), int(0.55 * h)
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
            if touches and len(blob) >= 80:
                for (x, y) in blob:
                    keep[y][x] = True

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if keep[y][x]:
                r, g, b = px[x, y]
                opx[x, y] = (r, g, b, 255)
    return out


def normalize(cell):
    """Scale to a consistent on-screen height and centre in the window."""
    bbox = cell.getbbox()
    if not bbox:
        return cell
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
    smoothed = Image.merge("RGBA", (*rgb.split(), a))
    small = smoothed.resize((COLS * CELL, ROWS * CELL), Image.LANCZOS)
    sr, sg, sb, sa = small.split()
    pal = Image.merge("RGB", (sr, sg, sb)).quantize(
        colors=PALETTE_COLORS, method=Image.MEDIANCUT, dither=Image.NONE
    ).convert("RGB")
    pr, pg, pb = pal.split()
    hard_a = sa.point(lambda v: 255 if v >= ALPHA_CUT else 0)
    return Image.merge("RGBA", (pr, pg, pb, hard_a))


def main():
    im = Image.open(SRC).convert("RGB")
    W, H = im.size
    cw, ch = W / COLS, H / ROWS
    big = Image.new("RGBA", (COLS * WINDOW, ROWS * WINDOW), (0, 0, 0, 0))
    for r in range(ROWS):
        keep_frac = KEEP_LABELLED if r >= 6 else KEEP_DEFAULT
        for c in range(COLS):
            x0, x1 = round(c * cw), round((c + 1) * cw)
            y0 = round(r * ch)
            y1 = round(r * ch + ch * keep_frac)
            cell = normalize(extract(im, (x0, y0, x1, y1)))
            big.paste(cell, (c * WINDOW, r * WINDOW))
    final = pixelate(big)
    final.save(OUT)
    print(f"wrote {OUT} {final.size} (6x8, cell {CELL}x{CELL}, {COLS * ROWS} frames)")


if __name__ == "__main__":
    main()
