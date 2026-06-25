#!/usr/bin/env python3
"""
GHOST — derived from the cat sheet, but a REAL ghost, not just a paler cat.
Two minimal SHAPE edits on top of the palette remap (see docs/skin-process.md,
Tier-1 "feature grafting"):
  1. translucency  -> spectral, the background shows through;
  2. the lower body (legs/boots/rocket-flame) is replaced, per frame, by a
     classic wavy ghost tail (scalloped hem).

Per-cell geometry: find the content bbox, cut at the "waist" (~60% down), keep
the head/arms above, and draw a tapering tail with a 3-lobe wavy hem below.
Robust across all 42 frames (uses each cell's own bbox, no fixed positions).

Output: public/assets/character_ghost.png (6x7 / 120px, drop-in).
"""
import colorsys
import math
from PIL import Image, ImageDraw, ImageFilter

SRC = "public/assets/character_cat.png"
OUT = "public/assets/character_ghost.png"
CELL = 120
COLS, ROWS = 6, 7

BODY    = (216, 230, 249)
BODY_SH = (176, 196, 230)
BODY_HI = (240, 247, 255)
GOUT    = (92, 104, 140)   # soft spectral outline
ALPHA   = 0.84             # translucency factor (spectral but still readable)


def hsv(h, s, v):
    r, g, b = colorsys.hsv_to_rgb(h % 1.0, max(0.0, min(1.0, s)), max(0.0, min(1.0, v)))
    return int(r * 255 + 0.5), int(g * 255 + 0.5), int(b * 255 + 0.5)


def ghost_color(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if v > 0.90 and s < 0.16:
        return (255, 255, 255)
    if v < 0.18:
        return GOUT
    return hsv(0.60, s * 0.30, min(1.0, v * 1.0 + 0.04))   # spectral wash (keeps shading)


def recolor_cell(cell):
    px = cell.load()
    w, h = cell.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            opx[x, y] = (*ghost_color(r, g, b), a)
    return out


def add_tail(cell):
    """Replace the lower body with a wavy ghost tail, using the cell's bbox."""
    bbox = cell.getbbox()
    if not bbox:
        return cell
    x0, y0, x1, y1 = bbox
    H = y1 - y0
    W = cell.size[0]
    waist = y0 + int(H * 0.60)
    px = cell.load()

    # TORSO width = the longest continuous opaque run near the waist (this
    # excludes the arms/hands, which are separate runs — the old bug made the
    # tail as wide as arm-to-arm, hence the ugly slab).
    best_len, bl, br = 0, 0, 0
    for yy in range(max(y0, waist - 2), min(y1, waist + 3)):
        x = 0
        while x < W:
            if px[x, yy][3] > 40:
                xs = x
                while x < W and px[x, yy][3] > 40:
                    x += 1
                if x - xs > best_len:
                    best_len, bl, br = x - xs, xs, x - 1
            else:
                x += 1
    if best_len < 6:
        return cell
    cx = (bl + br) / 2
    halfw = max(7.0, (br - bl) / 2)

    out = Image.new("RGBA", cell.size, (0, 0, 0, 0))
    # keep the body ABOVE the waist (drop legs/boots/rocket-flame)
    out.paste(cell.crop((0, 0, W, waist)), (0, 0))

    top = waist - 8                       # overlap up into the body (hides seam)
    skirt_bot = min(cell.size[1] - 2, y1)
    depth = max(5.0, min(9.0, halfw * 0.40))
    scallop_top = skirt_bot - depth
    mid_y = (top + scallop_top) / 2
    # narrower than the torso + a gentle bell curve so it reads as a hanging
    # body, not a flat-topped bucket. Top is narrowest (tucks into the body).
    w_top, w_mid, w_hem = halfw * 0.78, halfw * 0.96, halfw * 0.86
    hl, hr = cx - w_hem, cx + w_hem

    pts = [(cx - w_top, top), (cx - w_mid, mid_y), (hl, scallop_top)]
    lobes = 3
    lobe = (hr - hl) / lobes
    for i in range(lobes):
        lx = hl + i * lobe
        for t in (0.25, 0.5, 0.75, 1.0):
            xx = lx + t * lobe
            pts.append((xx, scallop_top + depth * math.sin(math.pi * t)))
    pts += [(cx + w_mid, mid_y), (cx + w_top, top)]

    layer = Image.new("RGBA", cell.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.polygon(pts, fill=(*BODY, 255))
    # cel shading (bands clipped within the body, above the hem)
    ld.rectangle([cx - w_mid * 0.9, top, cx - w_mid * 0.2, scallop_top - 1], fill=(*BODY_HI, 255))
    ld.rectangle([cx + w_mid * 0.35, top, cx + w_mid * 0.9, scallop_top - 1], fill=(*BODY_SH, 255))

    # outline ONLY the sides + hem (open polyline) — NOT the top, so it blends
    # seamlessly into the body it overlaps.
    ipts = [(int(round(a)), int(round(b))) for a, b in pts]
    ld.line(ipts, fill=(*GOUT, 255), width=2, joint="curve")

    out.alpha_composite(layer)
    return out


def apply_alpha(cell):
    r, g, b, a = cell.split()
    return Image.merge("RGBA", (r, g, b, a.point(lambda v: int(v * ALPHA) if v else 0)))


def build():
    im = Image.open(SRC).convert("RGBA")
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    for ry in range(ROWS):
        for cx in range(COLS):
            box = (cx * CELL, ry * CELL, cx * CELL + CELL, ry * CELL + CELL)
            cell = recolor_cell(im.crop(box))
            cell = add_tail(cell)
            cell = apply_alpha(cell)
            out.paste(cell, (cx * CELL, ry * CELL), cell)
    out.save(OUT)
    print(f"wrote {OUT} {out.size}")


if __name__ == "__main__":
    build()
