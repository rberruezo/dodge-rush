#!/usr/bin/env python3
"""
Tier-1 skin variants — DERIVED from the original painted sheets (highest
fidelity: they inherit the exact form/roundness/cuteness/shading; only the
palette is remapped). See docs/skin-process.md.

Each recipe is a per-pixel HSV remap applied to a source sheet:
  GOLD KING (from character) — gilded royal gold + emerald accents
  FROST     (from unicorn)   — icy monochrome blue, crystalline
  GHOST     (from cat)       — washed-out pale spectral blue-white

Run: python scripts/build-variants.py   (or pass names: king frost ghost)
Outputs: public/assets/character_{king,frost,ghost}.png  (6x7 / 120px, drop-in)
"""
import sys
import colorsys
from PIL import Image
from sprite_geom import map_cells, add_icicles, add_cape


def hsv(h, s, v):
    r, g, b = colorsys.hsv_to_rgb(h % 1.0, max(0.0, min(1.0, s)), max(0.0, min(1.0, v)))
    return int(r * 255 + 0.5), int(g * 255 + 0.5), int(b * 255 + 0.5)


def king(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if v > 0.90 and s < 0.16:
        return hsv(0.14, 0.30, 1.0)            # bright gold-white glint
    if v < 0.16:
        return hsv(0.09, 0.60, max(0.06, v * 1.1))   # warm dark-brown outline
    if 0.28 <= h <= 0.62:
        return hsv(0.38, min(1.0, s * 1.05), v * 0.9)  # teal -> emerald jewel
    return hsv(0.12, min(1.0, 0.34 + s * 0.45), v * 0.98)  # gild everything


def frost(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if v > 0.92 and s < 0.14:
        return (255, 255, 255)
    if v < 0.17:
        return hsv(0.60, 0.55, max(0.07, v))   # dark slate-blue outline
    return hsv(0.55, min(0.70, 0.10 + s * 0.55), min(1.0, v * 1.02))  # icy blue


# NOTE: GHOST is built by the dedicated scripts/build-ghost.py (it adds shape
# edits — translucency + a wavy tail — not just a recolour), so it's not here.
# Each recipe: (source, output, colour_fn, optional per-cell shape signature).
RECIPES = {
    "king":  ("character",         "character_king",  king,  add_cape),
    "frost": ("character_unicorn", "character_frost", frost, add_icicles),
}


def recolor(src_key, out_key, fn, shape=None):
    im = Image.open(f"public/assets/{src_key}.png").convert("RGBA")
    px = im.load()
    w, h = im.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            opx[x, y] = (*fn(r, g, b), a)
    if shape is not None:                     # per-cell shape signature
        out = map_cells(out, shape)
    out.save(f"public/assets/{out_key}.png")
    print(f"wrote public/assets/{out_key}.png {out.size}")


if __name__ == "__main__":
    names = sys.argv[1:] or list(RECIPES)
    for n in names:
        src, out, fn, shape = RECIPES[n]
        recolor(src, out, fn, shape)
