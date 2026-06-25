#!/usr/bin/env python3
"""
Build a clean, small, uniform coin-spin sprite strip from the source sheet.

The source has the rotation frames laid out irregularly (6 top, 1 middle edge,
6 bottom). We detect each frame, order them into the spin sequence (top L->R,
middle, bottom L->R), centre each in a uniform square cell (so the coin spins in
place — the thin edge frames stay centred), then downscale + tidy to a tiny strip
sized for the HUD/menu.

Output: public/assets/coin.png  (a single row of N square frames).
"""
from collections import deque
from PIL import Image, ImageFilter

SRC = "/Users/rama/Downloads/Gemini_Generated_Image_tb8okytb8okytb8o.png"
OUT = "public/assets/coin.png"
CELL = 40            # output frame size (px) — small, HUD-scale
PALETTE_COLORS = 16
ALPHA_CUT = 110


def is_bg(px):
    r, g, b, a = px
    if a < 40:
        return True
    return min(r, g, b) > 200 and (max(r, g, b) - min(r, g, b)) < 40  # white


def detect(im):
    W, H = im.size
    p = im.load()
    seen = [[False] * W for _ in range(H)]
    boxes = []
    for y in range(H):
        for x in range(W):
            if seen[y][x] or is_bg(p[x, y]):
                continue
            q = deque([(x, y)])
            seen[y][x] = True
            mnx = mxx = x
            mny = myy = y
            n = 0
            while q:
                cx, cy = q.popleft()
                n += 1
                mnx = min(mnx, cx); mxx = max(mxx, cx)
                mny = min(mny, cy); myy = max(myy, cy)
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < W and 0 <= ny < H and not seen[ny][nx] and not is_bg(p[nx, ny]):
                            seen[ny][nx] = True
                            q.append((nx, ny))
            if n > 150:
                boxes.append((mnx, mny, mxx - mnx + 1, myy - mny + 1))
    # order: by row band (y), then left->right
    boxes.sort(key=lambda b: (round((b[1] + b[3] / 2) / 200), b[0]))
    return boxes


def cut(im, box):
    """Crop a frame, keep only non-bg pixels (transparent elsewhere)."""
    x, y, w, h = box
    crop = im.crop((x, y, x + w, y + h))
    px = crop.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for j in range(h):
        for i in range(w):
            if not is_bg(px[i, j]):
                op[i, j] = px[i, j]
    return out


def main():
    im = Image.open(SRC).convert("RGBA")
    boxes = detect(im)
    frames = [cut(im, b) for b in boxes]
    n = len(frames)
    src_cell = max(max(f.width, f.height) for f in frames) + 6

    # Assemble at source resolution, centred in square cells.
    strip = Image.new("RGBA", (src_cell * n, src_cell), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        ox = i * src_cell + (src_cell - f.width) // 2
        oy = (src_cell - f.height) // 2
        strip.alpha_composite(f, (ox, oy))

    # Downscale + tidy.
    small = strip.resize((CELL * n, CELL), Image.LANCZOS)
    r, g, b, a = small.split()
    rgb = Image.merge("RGB", (r, g, b)).filter(ImageFilter.MedianFilter(3))
    pal = rgb.quantize(colors=PALETTE_COLORS, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
    pr, pg, pb = pal.split()
    a = a.point(lambda v: 255 if v >= ALPHA_CUT else 0)
    final = Image.merge("RGBA", (pr, pg, pb, a))
    final.save(OUT)
    print(f"wrote {OUT} {final.size}  frames={n}  cell={CELL}")


main()
