#!/usr/bin/env python3
"""
Build the clean pixel-art character sheet from the rich emotion/action source.

The source is a card-style sheet (checker + white rounded cards behind each
sprite, no alpha). For each needed sprite we crop a uniform window centred on it,
remove the background with an edge flood-fill (deletes checker + white card but
keeps the character's *enclosed* white highlights), isolate the central blob
(drops neighbouring-card fragments), then pixelate (denoise → downscale → tight
palette → hard alpha) for a hand-drawn pixel-art look.

Output: a uniform 6x6 grid (50x50 cells) at public/assets/character.png.

Frame map (index = row*6 + col):
  row0  0-5   idle (front)
  row1  6-11  fly (side, focused)        -> falling / movement loop
  row2 12-17  cheer (arms up)            -> celebration / new best
  row3 18-23  combo: x1,x2,x3,x5,x10,x20 -> player sprite per combo tier
  row4 24-29  dizzy, sad-cloud, trophy, crown, star-eyes head, sad head
  row5 30-35  fly-boost (sparkles)       -> golden score-boost flight
"""
import sys
from collections import deque
from PIL import Image, ImageFilter

DEFAULT_SRC = "/Users/rama/Downloads/ChatGPT Image 24 jun 2026, 10_40_44 p.m..png"
OUT = "public/assets/character.png"

WINDOW = 176   # square crop window (source px) centred on each sprite
CELL = 50      # output cell size
COLS, ROWS = 6, 6
PRE_SMOOTH = 5
POST_SMOOTH = 3
PALETTE_COLORS = 28
ALPHA_CUT = 120

# Detected sprite centres (cx, cy) in the source, grouped by category.
CENTERS = {
    "idle": [(93, 122), (252, 122), (411, 122), (569, 123), (727, 123), (885, 123)],
    "fly": [(103, 503), (262, 502), (421, 502), (580, 502), (738, 502), (896, 502)],
    "cheer": [(95, 884), (262, 884), (428, 884), (590, 884), (757, 878), (920, 884)],
    "combo": [(86, 1410), (251, 1410), (417, 1410), (583, 1413), (756, 1416), (916, 1420)],
    "boost": [(102, 692), (271, 695), (451, 694), (637, 694), (806, 697)],
    # dizzy, sad-cloud, trophy, crown, star-eyes head, sad head
    "specials": [(496, 1232), (688, 1226), (113, 1226), (310, 1225), (756, 1054), (921, 1054)],
}

# Output grid: list of (category, source-index) per cell, row-major.
GRID = (
    [("idle", i) for i in range(6)]
    + [("fly", i) for i in range(6)]
    + [("cheer", i) for i in range(6)]
    + [("combo", i) for i in range(6)]
    + [("specials", i) for i in range(6)]
    + [("boost", i) for i in range(5)] + [("boost", 4)]  # pad to 6
)


def is_bg(r, g, b):
    return min(r, g, b) > 175 and (max(r, g, b) - min(r, g, b)) < 45


def extract(im, cx, cy):
    """Crop a window, strip the card/checker background, keep the central sprite."""
    half = WINDOW // 2
    crop = im.crop((cx - half, cy - half, cx - half + WINDOW, cy - half + WINDOW)).convert("RGB")
    w, h = crop.size
    px = crop.load()

    # 1) Flood-fill background inward from the window edges.
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

    # 2) Keep only the connected blob that reaches the centre (drop neighbour bits).
    seen = [[False] * w for _ in range(h)]
    keep = [[False] * w for _ in range(h)]
    cl, cr = int(0.30 * w), int(0.70 * w)
    ct, cb = int(0.22 * h), int(0.78 * h)
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
                r, g, b = px[x, y]
                opx[x, y] = (r, g, b, 255)
    return out


def pixelate(sheet):
    sw, sh = sheet.size
    r, g, b, a = sheet.split()
    rgb = Image.merge("RGB", (r, g, b)).filter(ImageFilter.MedianFilter(PRE_SMOOTH))
    smoothed = Image.merge("RGBA", (*rgb.split(), a))
    small = smoothed.resize((COLS * CELL, ROWS * CELL), Image.LANCZOS)
    sr, sg, sb, sa = small.split()
    clean = Image.merge("RGB", (sr, sg, sb)).filter(ImageFilter.MedianFilter(POST_SMOOTH))
    pal = clean.quantize(colors=PALETTE_COLORS, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
    pr, pg, pb = pal.split()
    hard_a = sa.point(lambda v: 255 if v >= ALPHA_CUT else 0)
    return Image.merge("RGBA", (pr, pg, pb, hard_a))


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
    im = Image.open(src).convert("RGB")

    big = Image.new("RGBA", (COLS * WINDOW, ROWS * WINDOW), (0, 0, 0, 0))
    for idx, (cat, i) in enumerate(GRID):
        cx, cy = CENTERS[cat][i]
        cell = extract(im, cx, cy)
        c, r = idx % COLS, idx // COLS
        big.paste(cell, (c * WINDOW, r * WINDOW))

    final = pixelate(big)
    final.save(OUT)
    print(f"wrote {OUT} {final.size} (cell {CELL}x{CELL}, {len(GRID)} frames)")


if __name__ == "__main__":
    main()
