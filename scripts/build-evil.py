#!/usr/bin/env python3
"""
NEMESIS — the "evil twin" of the original hero, Wario-to-Mario style.

KEY IDEA / PROCESS: do NOT redraw. DERIVE from the original painted sheet so the
result inherits the exact silhouette, roundness, cuteness and painterly shading
of `character.png` — then only the *palette* is corrupted into a villain scheme.
This is the highest-fidelity way to make a new skin that truly matches the
originals (see also docs/skin-process.md).

Transform = per-pixel HSV region remap on character.png:
  pink suit   -> deep violet, darker      gold trim -> dark olive-gold
  cream skin  -> sickly pale olive        teal      -> acid green
  white glints-> eerie acid sheen         outline   -> cold purple-black
Alpha is preserved untouched (keeps the original's clean silhouette).

Output: public/assets/character_evil.png (same 6x7 / 120px layout, drop-in).
"""
import colorsys
from PIL import Image

SRC = "public/assets/character.png"
OUT = "public/assets/character_evil.png"


def hsv(h, s, v):
    r, g, b = colorsys.hsv_to_rgb(h % 1.0, max(0.0, min(1.0, s)), max(0.0, min(1.0, v)))
    return int(r * 255 + 0.5), int(g * 255 + 0.5), int(b * 255 + 0.5)


def corrupt(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    # 1) bright glints (eye/metal sparkle) -> eerie acid sheen
    if v > 0.90 and s < 0.16:
        return hsv(0.20, 0.55, 0.98)
    # 2) outline / near-black -> cold purple-black
    if v < 0.16:
        return hsv(0.74, 0.40, max(0.05, v * 0.95))
    # 3) pink / magenta / red suit -> deep violet, darkened
    if s > 0.33 and (h > 0.80 or h < 0.06):
        return hsv(0.735, min(1.0, s * 1.02), v * 0.60)
    # 4) gold / orange accents -> dark olive-gold
    if s > 0.38 and 0.04 <= h <= 0.18:
        return hsv(0.15, s * 0.72, v * 0.58)
    # 5) cream / skin (warm, lower sat, bright) -> sickly pale olive
    if v > 0.52 and s < 0.45:
        return hsv(0.23, 0.20 + s * 0.10, v * 0.80)
    # 6) teal / cyan / green accents -> acid green
    if 0.28 <= h <= 0.62:
        return hsv(0.26, min(1.0, s * 1.1), v * 0.92)
    # 7) everything else -> darken + cool toward violet
    return hsv((h * 0.5 + 0.735 * 0.5) % 1.0, min(1.0, s * 1.05), v * 0.74)


def build():
    im = Image.open(SRC).convert("RGBA")
    px = im.load()
    w, h = im.size

    # classify original pixels: dark (eye candidate) and skin (cream face)
    import colorsys
    dark = [[False] * w for _ in range(h)]
    skin = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            hh, ss, vv = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            dark[y][x] = vv < 0.34
            skin[y][x] = vv > 0.64 and 0.02 < hh < 0.20 and 0.12 < ss < 0.62

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            opx[x, y] = (*corrupt(r, g, b), a)

    # GLOWING RED EYES — robust across all 42 frames, no per-frame placement.
    # An eye/mouth pixel is DARK and ENCLOSED by skin: cast 4 rays (up/down/
    # left/right); if skin is hit within a few px in >=3 directions it's an
    # interior facial feature. Suit seams fail this (suit, not skin, around them).
    def skin_in_dir(x, y, dx, dy):
        for step in range(1, 6):
            nx, ny = x + dx * step, y + dy * step
            if not (0 <= nx < w and 0 <= ny < h):
                return False
            if skin[ny][nx]:
                return True
            if not dark[ny][nx]:   # hit non-skin, non-dark -> stop
                return False
        return False

    for y in range(h):
        for x in range(w):
            if not dark[y][x]:
                continue
            hits = sum(skin_in_dir(x, y, dx, dy)
                       for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            if hits >= 3:
                r0, g0, b0, a0 = px[x, y]
                glint = max(r0, g0, b0) / 255 > 0.5
                opx[x, y] = ((255, 140, 110, a0) if glint else (224, 32, 28, a0))

    # SHAPE SIGNATURE: little devil horns on the helmet (per-cell).
    from sprite_geom import map_cells, add_horns
    out = map_cells(out, add_horns)

    out.save(OUT)
    print(f"wrote {OUT} {out.size}")


if __name__ == "__main__":
    build()
