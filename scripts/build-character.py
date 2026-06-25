#!/usr/bin/env python3
"""
Build the character sheet from the rich emotion/action source.

Higher resolution than before: cells are 120px so the in-game sprite renders at
~1:1 (no upscaling) and looks crisp against the detailed background. Background
is removed per cell with an edge flood-fill (keeps enclosed white highlights),
the central blob is isolated, then a light denoise + tight-ish palette + hard
alpha give a clean look without losing detail.

Output: uniform 6x7 grid (120px cells) at public/assets/character.png.
Frame map (index = row*6 + col):
  row0  0-5   hover (front)         -> idle / not steering ("alive")
  row1  6-11  side flight, calm     -> moving (low effort)
  row2 12-17  side flight, straining-> moving held (high effort)
  row3 18-23  flight + sparkles     -> golden score boost
  row4 24-29  cheer (arms up)       -> celebration
  row5 30-35  combo x1,x2,x3,x5,x10,x20 -> brief combo celebration flash
  row6 36-41  dizzy, sad-cloud, trophy, crown, star-eyes head, sad head
"""
import sys
from collections import deque
from PIL import Image, ImageFilter

DEFAULT_SRC = "/Users/rama/Downloads/ChatGPT Image 24 jun 2026, 10_40_44 p.m..png"
OUT = "public/assets/character.png"

WINDOW = 176
CELL = 120          # high-res cell (rendered ~1:1 in game -> crisp)
COLS, ROWS = 6, 7
PRE_SMOOTH = 3      # gentle denoise (keep detail at this resolution)
PALETTE_COLORS = 40
ALPHA_CUT = 115
NORM_H = 132        # normalised content height (window px) -> consistent size
NORM_W = 150        # cap width for wide poses

CENTERS = {
    "hover": [(93, 122), (252, 122), (411, 122), (569, 123), (727, 123), (885, 123)],
    "move": [(103, 503), (262, 502), (421, 502), (580, 502), (738, 502), (896, 502)],
    "move_hard": [(87, 316), (247, 316), (405, 316), (564, 316), (723, 316), (881, 316)],
    "boost": [(102, 692), (271, 695), (451, 694), (637, 694), (806, 697)],
    "cheer": [(95, 884), (262, 884), (428, 884), (590, 884), (757, 878), (920, 884)],
    "combo": [(86, 1410), (251, 1410), (417, 1410), (583, 1413), (756, 1416), (916, 1420)],
    # dizzy, sad-cloud, trophy, crown, star-eyes head, sad head
    "specials": [(496, 1232), (688, 1226), (113, 1226), (310, 1225), (756, 1054), (921, 1054)],
}

GRID = (
    [("hover", i) for i in range(6)]
    + [("move", i) for i in range(6)]
    + [("move_hard", i) for i in range(6)]
    + [("boost", i) for i in range(5)] + [("boost", 4)]
    + [("cheer", i) for i in range(6)]
    + [("combo", i) for i in range(6)]
    + [("specials", i) for i in range(6)]
)


def is_bg(r, g, b):
    return min(r, g, b) > 175 and (max(r, g, b) - min(r, g, b)) < 45


def extract(im, cx, cy):
    half = WINDOW // 2
    crop = im.crop((cx - half, cy - half, cx - half + WINDOW, cy - half + WINDOW)).convert("RGB")
    w, h = crop.size
    px = crop.load()

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


def normalize(cell):
    """
    Scale the sprite to a consistent on-screen size and centre it, so switching
    poses (idle vs moving vs combo) never makes the character grow/shrink.
    Normalises by content height (capped by width for very wide poses).
    """
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
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
    im = Image.open(src).convert("RGB")
    big = Image.new("RGBA", (COLS * WINDOW, ROWS * WINDOW), (0, 0, 0, 0))
    for idx, (cat, i) in enumerate(GRID):
        cx, cy = CENTERS[cat][i]
        c, r = idx % COLS, idx // COLS
        big.paste(normalize(extract(im, cx, cy)), (c * WINDOW, r * WINDOW))
    final = pixelate(big)
    final.save(OUT)
    print(f"wrote {OUT} {final.size} (cell {CELL}x{CELL}, {len(GRID)} frames)")


if __name__ == "__main__":
    main()
