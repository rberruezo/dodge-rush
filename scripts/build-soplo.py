#!/usr/bin/env python3
"""
Build the SOPLO skin sheet (dandelion-seed sprite), RE-DONE in the shaded house
style of character / cat / unicorn / phoenix: dark unified outline, cel shading,
big shiny eyes, ~40-colour palette, plus a small teal dew accent for cohesion.

Same technique as build-phoenix.py:
  1. draw every frame at 3x with smooth shaded shapes,
  2. add a uniform dark outline by dilating the silhouette alpha,
  3. downscale (LANCZOS) + median + 40-colour quantize + hard alpha — the SAME
     post-process build-skins.py runs on cat/unicorn.

Output: public/assets/character_soplo.png — uniform 6x7 grid of 120px cells.
Frame map matches CHARACTER_ANIMS / CHAR_FRAMES (see Constants.ts).
"""
import math
from PIL import Image, ImageDraw, ImageFilter

OUT = "public/assets/character_soplo.png"
COLS, ROWS = 6, 7
CELL = 120
SS = 3
TILE = CELL * SS
PALETTE_COLORS = 40
ALPHA_CUT = 128
OUTLINE_PX = 9

# --- palette ----------------------------------------------------------------
OUTLINE   = (48, 44, 60)
FLUFF_HI  = (255, 255, 255)
FLUFF     = (230, 238, 247)
FLUFF_SH  = (190, 204, 222)
FLUFF_SH2 = (158, 174, 200)
SEED      = (212, 190, 152)
STEM_HI   = (172, 226, 150)
STEM      = (118, 196, 120)
STEM_SH   = (72, 150, 92)
EYE       = (46, 42, 58)
WHITE     = (255, 255, 255)
BLUSH     = (255, 166, 196)
TEAL      = (66, 198, 186)
TEAL_HI   = (170, 232, 222)
MINT      = (176, 240, 212)
MINT_HI   = (224, 252, 240)
GOLD      = (255, 206, 74)
GOLD_DK   = (208, 150, 30)
SMOKE     = (150, 150, 158)
RAIN      = (120, 196, 210)


def S(v):
    return int(round(v * SS))


def A(rgb, a=255):
    return (rgb[0], rgb[1], rgb[2], a)


def oval(d, cx, cy, rx, ry, rgb, a=255):
    d.ellipse([S(cx - rx), S(cy - ry), S(cx + rx), S(cy + ry)], fill=A(rgb, a))


def poly(d, pts, rgb, a=255):
    d.polygon([(S(x), S(y)) for x, y in pts], fill=A(rgb, a))


def line(d, x0, y0, x1, y1, w, rgb, a=255):
    d.line([S(x0), S(y0), S(x1), S(y1)], fill=A(rgb, a), width=max(1, S(w)))


def arc(d, cx, cy, rx, ry, a0, a1, w, rgb):
    d.arc([S(cx - rx), S(cy - ry), S(cx + rx), S(cy + ry)], a0, a1,
          fill=A(rgb), width=max(1, S(w)))


# --- dandelion parts --------------------------------------------------------
def fluff(d, cx, cy, r, sway=0.0, spin=0.0, puff=1.0, droop=0.0, n=13):
    """Shaded pappus ball with radiating tufted spokes."""
    # spokes (behind the core)
    for i in range(n):
        a = spin + i / n * math.tau
        bend = math.sin(a) * sway
        L = r * (0.34 * puff) * (0.78 + 0.44 * ((i * 7) % 5) / 5.0)
        inr = r * 0.80
        ix, iy = cx + math.cos(a) * inr, cy + math.sin(a) * inr
        ox = cx + math.cos(a) * (inr + L) + bend
        oy = cy + math.sin(a) * (inr + L) + droop * max(0.0, math.sin(a))
        line(d, ix, iy, ox, oy, 2.0, FLUFF_SH)
        oval(d, ox, oy, 1.7, 1.7, FLUFF_HI)
    # shaded core
    oval(d, cx, cy + r * 0.05, r, r, FLUFF_SH2)              # shadow base
    oval(d, cx, cy - r * 0.06, r * 0.94, r * 0.92, FLUFF)    # main
    oval(d, cx - r * 0.32, cy - r * 0.34, r * 0.52, r * 0.5, FLUFF_HI)  # hi
    # seed flecks for texture
    for i in range(7):
        a = i / 7 * math.tau + 0.5
        oval(d, cx + math.cos(a) * r * 0.46, cy + math.sin(a) * r * 0.46,
             0.9, 0.9, SEED)


def stalk(d, cx, top, arms="side", lean=0.0, dew=True):
    bx = cx + lean
    # stalk (green, shaded)
    line(d, cx, top, bx, top + 16, 3.2, STEM_SH)
    line(d, cx, top, bx, top + 16, 2.0, STEM)
    line(d, cx - 0.6, top + 1, bx - 0.6, top + 12, 0.8, STEM_HI)
    # feet
    line(d, bx, top + 16, bx - 3, top + 18, 1.6, STEM_SH)
    line(d, bx, top + 16, bx + 3, top + 18, 1.6, STEM_SH)
    # leaf-arms
    def leaf(ax, ay, ex, ey):
        poly(d, [(ax, ay), ((ax + ex) / 2, ey - 3), (ex, ey),
                 ((ax + ex) / 2, ey + 2)], STEM_SH)
        poly(d, [(ax, ay), ((ax + ex) / 2, ey - 2), (ex, ey - 0.5)], STEM)

    if arms == "up":
        leaf(bx - 1, top + 4, bx - 8, top - 5)
        leaf(bx + 1, top + 4, bx + 8, top - 5)
    elif arms == "forward":
        leaf(bx, top + 6, bx + 10, top + 2)
        leaf(bx, top + 8, bx + 9, top + 7)
    else:  # side
        leaf(bx - 1, top + 6, bx - 9, top + 8)
        leaf(bx + 1, top + 6, bx + 9, top + 8)
    if dew:  # tiny teal dew bead for roster cohesion
        oval(d, bx + 8, top + 8, 1.8, 2.2, TEAL)
        oval(d, bx + 7.4, top + 7.3, 0.7, 0.8, TEAL_HI)


def seed_fly(d, x, y, color=MINT):
    line(d, x, y, x, y + 4, 1.4, STEM_SH)
    oval(d, x, y, 1.8, 1.8, color)
    oval(d, x - 0.6, y - 0.6, 0.7, 0.7, MINT_HI)


def sparkle(d, x, y, s=3, color=WHITE):
    line(d, x - s, y, x + s, y, 1.4, color)
    line(d, x, y - s, x, y + s, 1.4, color)


def face(d, cx, cy, expr="calm"):
    le, re = cx - 6, cx + 6
    ey = cy
    if expr in ("calm", "happy"):
        for ox, rr in ((le, 5.0), (re, 5.4)):
            oval(d, ox, ey, rr, rr + 0.6, EYE)
            oval(d, ox - 1.4, ey - 1.6, rr * 0.42, rr * 0.42, WHITE)
            oval(d, ox + 1.2, ey + 1.7, rr * 0.22, rr * 0.22, WHITE)
        oval(d, le - 4, ey + 5, 2.4, 1.6, BLUSH)
        oval(d, re + 4, ey + 5, 2.4, 1.6, BLUSH)
        arc(d, cx, cy + 4, 3.0, 2.6, 20, 160, 1.6, EYE)
    elif expr == "joy":
        for ox in (le, re):
            arc(d, ox, ey + 1, 3.2, 3.0, 185, 355, 1.5, EYE)
        oval(d, le - 4, ey + 5, 2.4, 1.6, BLUSH)
        oval(d, re + 4, ey + 5, 2.4, 1.6, BLUSH)
        d.pieslice([S(cx - 3.2), S(cy + 2), S(cx + 3.2), S(cy + 8)], 10, 170, fill=A(EYE))
        oval(d, cx, cy + 6, 1.0, 1.0, BLUSH)
    elif expr in ("strain", "determined"):
        for ox, rr in ((le, 4.6), (re, 4.8)):
            oval(d, ox, ey + 1, rr, rr, EYE)
            oval(d, ox - 1.2, ey - 0.4, rr * 0.4, rr * 0.4, WHITE)
            poly(d, [(ox - rr - 1, ey - rr), (ox + rr + 1, ey - rr - 1.4),
                     (ox + rr + 1, ey - rr * 0.2), (ox - rr - 1, ey + rr * 0.1)],
                 FLUFF_SH)
        line(d, cx - 3, cy + 5, cx + 3, cy + 5, 1.6, EYE)
    elif expr == "star":
        for ox in (le, re):
            for k in range(4):
                aa = k * math.pi / 4
                line(d, ox, ey, ox + math.cos(aa) * 4, ey + math.sin(aa) * 4, 1.4, GOLD)
            oval(d, ox, ey, 1.6, 1.6, WHITE)
        d.pieslice([S(cx - 3.2), S(cy + 2), S(cx + 3.2), S(cy + 8)], 10, 170, fill=A(EYE))
    elif expr == "dizzy":
        for ox in (le, re):
            line(d, ox - 3, ey - 3, ox + 3, ey + 3, 1.5, EYE)
            line(d, ox - 3, ey + 3, ox + 3, ey - 3, 1.5, EYE)
        arc(d, cx, cy + 6, 3, 2, 0, 180, 1.4, EYE)
    elif expr == "sad":
        for ox, rr in ((le, 4.6), (re, 4.8)):
            oval(d, ox, ey + 1.5, rr, rr, EYE)
            oval(d, ox - 1.2, ey, rr * 0.4, rr * 0.4, WHITE)
        line(d, le - 4, ey - 5, le + 2, ey - 3, 1.2, FLUFF_SH2)
        line(d, re - 2, ey - 3, re + 4, ey - 5, 1.2, FLUFF_SH2)
        arc(d, cx, cy + 7, 3, 2.4, 180, 360, 1.4, EYE)
        line(d, re + 3, ey + 4, re + 4, ey + 8, 1.4, TEAL)


# --- frame composers (face RIGHT; move rows flipped later) ------------------
def t_blank():
    tile = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    return tile, ImageDraw.Draw(tile)


def cph(i, n=6):
    return math.sin(i / n * math.tau)


def f_hover(i):
    tile, d = t_blank()
    bob = cph(i) * 2
    cy = 44 + bob
    fluff(d, 58, cy, 20, sway=cph(i) * 2.0)
    stalk(d, 58, cy + 19, arms="side")
    face(d, 58, cy + 1, "calm")
    return tile


def f_move(i, hard=False):
    tile, d = t_blank()
    lean = 5 if hard else 3
    flut = cph(i) * (3 if hard else 2)
    cy = 44
    fluff(d, 58 - lean * 0.4, cy, 20 if not hard else 19,
          sway=-(5 + flut) if not hard else -(7 + flut))
    stalk(d, 58, cy + 19, arms="forward", lean=lean)
    face(d, 60, cy + 1, "strain" if hard else "determined")
    if hard:
        for k in range(2):
            seed_fly(d, 80 + k * 4, 38 + k * 8 + round(flut))
    return tile


def f_boost(i):
    tile, d = t_blank()
    cy = 44
    fluff(d, 58, cy, 20, spin=i / 6 * math.tau, puff=1.18)
    stalk(d, 58, cy + 19, arms="up")
    face(d, 58, cy + 1, "joy")
    for k in range(5):
        ang = i / 6 * math.tau + k * 1.26
        sx = 58 + math.cos(ang) * 24
        sy = cy + 18 + ((k * 9 + i * 7) % 40)
        seed_fly(d, sx, sy)
    sparkle(d, 26, 26, 3, MINT_HI)
    sparkle(d, 92, 36, 3, WHITE)
    return tile


def f_cheer(i):
    tile, d = t_blank()
    cy = 43 - (i % 2)
    fluff(d, 58, cy, 21, puff=1.0 + (i % 3) * 0.08, sway=cph(i) * 1.5)
    stalk(d, 58, cy + 20, arms="up")
    face(d, 58, cy + 1, "joy")
    if i % 2 == 0:
        seed_fly(d, 28, 28)
        seed_fly(d, 88, 30)
    sparkle(d, 24, 40, 3, MINT_HI)
    sparkle(d, 94, 34, 3, MINT_HI)
    return tile


def f_combo(i):
    tile, d = t_blank()
    cy = 46
    tier = i
    fluff(d, 58, cy, 20, puff=1.0 + tier * 0.05)
    stalk(d, 58, cy + 19, arms="up")
    face(d, 58, cy + 1, "star" if tier >= 3 else "joy")
    cnt = 5 + tier * 2
    for k in range(cnt):
        ang = k / cnt * math.tau
        rr = 24 + tier
        sx, sy = 58 + math.cos(ang) * rr, cy + math.sin(ang) * rr
        if tier >= 4:
            sparkle(d, sx, sy, 3, GOLD)
        else:
            seed_fly(d, sx, sy, MINT_HI if tier < 2 else MINT)
    return tile


def head_only(expr, extra=None, droop=0.0):
    tile, d = t_blank()
    cy = 52
    fluff(d, 58, cy, 22, droop=droop, puff=0.9 if droop else 1.0)
    face(d, 58, cy + 1, expr)
    if extra:
        extra(d)
    return tile


def f_dizzy():
    def stars(d):
        for k in range(3):
            a = k / 3 * math.tau
            sparkle(d, 58 + math.cos(a) * 20, 26 + math.sin(a) * 5, 2, GOLD)
    return head_only("dizzy", stars, droop=4)


def f_sadcloud():
    def cloud(d):
        gy = 16
        for ox, r in ((-7, 6), (0, 7), (7, 6)):
            oval(d, 58 + ox, gy, r, r * 0.82, (150, 162, 184))
        oval(d, 58, gy - 2, 6, 5, (182, 196, 216))
        for k in range(4):
            rx = 50 + k * 5
            line(d, rx, gy + 7, rx - 1, gy + 13, 1.4, RAIN)
    return head_only("sad", cloud, droop=3)


def f_trophy():
    tile, d = t_blank()
    cx, cy = 58, 60
    d.pieslice([S(cx - 12), S(cy - 14), S(cx + 12), S(cy + 8)], 0, 180, fill=A(GOLD))
    d.rectangle([S(cx - 12), S(cy - 14), S(cx + 12), S(cy - 4)], fill=A(GOLD))
    oval(d, cx, cy - 16, 12, 4, GOLD_DK)
    arc(d, cx - 16, cy - 8, 8, 9, 60, 300, 2, GOLD_DK)
    arc(d, cx + 16, cy - 8, 8, 9, 240, 480, 2, GOLD_DK)
    d.rectangle([S(cx - 3), S(cy + 6), S(cx + 3), S(cy + 13)], fill=A(GOLD_DK))
    d.rectangle([S(cx - 9), S(cy + 13), S(cx + 9), S(cy + 18)], fill=A(GOLD))
    seed_fly(d, cx - 4, cy - 8)
    return tile


def f_crown():
    tile, d = t_blank()
    cx, cy = 58, 62
    pts = [(cx - 15, cy + 9), (cx - 15, cy - 7), (cx - 7, cy + 2), (cx, cy - 11),
           (cx + 7, cy + 2), (cx + 15, cy - 7), (cx + 15, cy + 9)]
    poly(d, pts, GOLD)
    d.rectangle([S(cx - 15), S(cy + 5), S(cx + 15), S(cy + 9)], fill=A(GOLD_DK))
    for jx, col in ((cx, TEAL), (cx - 9, MINT), (cx + 9, MINT)):
        oval(d, jx, cy + 4, 2, 2, col)
    for tx in (cx - 15, cx, cx + 15):
        ty = cy - 11 if tx == cx else cy - 7
        oval(d, tx, ty, 1.6, 1.6, FLUFF_HI)
    return tile


# --- outline + post-process -------------------------------------------------
def add_outline(tile, size=OUTLINE_PX, rgb=OUTLINE):
    a = tile.getchannel("A")
    da = a.filter(ImageFilter.MaxFilter(size))
    base = Image.new("RGBA", tile.size, (0, 0, 0, 0))
    solid = Image.new("RGBA", tile.size, A(rgb))
    base.paste(solid, (0, 0), da)
    base.alpha_composite(tile)
    return base


def build():
    rows = []
    rows.append([f_hover(i) for i in range(6)])
    rows.append([f_move(i, False) for i in range(6)])
    rows.append([f_move(i, True) for i in range(6)])
    rows.append([f_boost(i) for i in range(6)])
    rows.append([f_cheer(i) for i in range(6)])
    rows.append([f_combo(i) for i in range(6)])
    rows.append([f_dizzy(), f_sadcloud(), f_trophy(), f_crown(),
                 head_only("star"), head_only("sad", droop=3)])

    big = Image.new("RGBA", (COLS * TILE, ROWS * TILE), (0, 0, 0, 0))
    for ry, row in enumerate(rows):
        for cx, tile in enumerate(row):
            tile = add_outline(tile)
            if ry in (1, 2):
                tile = tile.transpose(Image.FLIP_LEFT_RIGHT)
            big.paste(tile, (cx * TILE, ry * TILE), tile)

    small = big.resize((COLS * CELL, ROWS * CELL), Image.LANCZOS)
    r, g, b, al = small.split()
    rgb = Image.merge("RGB", (r, g, b)).filter(ImageFilter.MedianFilter(3))
    pal = rgb.quantize(colors=PALETTE_COLORS, method=Image.MEDIANCUT,
                       dither=Image.NONE).convert("RGB")
    pr, pg, pb = pal.split()
    hard_a = al.point(lambda v: 255 if v >= ALPHA_CUT else 0)
    final = Image.merge("RGBA", (pr, pg, pb, hard_a))
    final.save(OUT)
    print(f"wrote {OUT} {final.size}")


if __name__ == "__main__":
    build()
