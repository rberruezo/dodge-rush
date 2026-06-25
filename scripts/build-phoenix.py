#!/usr/bin/env python3
"""
Build the POLLITO FENIX (baby-phoenix) skin sheet procedurally, matched to the
look of character / cat / unicorn: dark unified outline, 3-tone cel shading,
big shiny eyes, warm feather ramp + a teal aviator scarf (echoes the cat), and
flame crest / tail.

Technique that makes it blend with the AI-painted sheets:
  1. draw every frame at 3x resolution with smooth shaded shapes,
  2. add a uniform dark outline by dilating the silhouette alpha,
  3. downscale the whole sheet (LANCZOS) + median + 40-colour quantize + hard
     alpha — the SAME post-process build-skins.py runs on cat/unicorn.

Output: public/assets/character_phoenix.png — uniform 6x7 grid of 120px cells.
Frame map matches CHARACTER_ANIMS / CHAR_FRAMES (see Constants.ts).
"""
import math
from PIL import Image, ImageDraw, ImageFilter

OUT = "public/assets/character_phoenix.png"
COLS, ROWS = 6, 7
CELL = 120
SS = 3                      # supersample factor
TILE = CELL * SS           # hi-res cell
PALETTE_COLORS = 40
ALPHA_CUT = 128
OUTLINE_PX = 9             # MaxFilter size on hi-res alpha (~1.5 final px)

# --- palette (RGB) ----------------------------------------------------------
OUTLINE  = (44, 24, 20)
FEA_HI   = (255, 201, 104)
FEA      = (250, 146, 52)
FEA_SH   = (208, 90, 30)
BELLY    = (255, 230, 170)
BELLY_HI = (255, 244, 206)
BEAK     = (252, 196, 64)
BEAK_SH  = (206, 140, 28)
FL_Y     = (255, 226, 104)
FL_O     = (252, 138, 40)
FL_R     = (230, 62, 30)
EYE      = (40, 26, 24)
WHITE    = (255, 255, 255)
SCARF    = (66, 198, 186)
SCARF_SH = (34, 150, 142)
SCARF_HI = (150, 226, 216)
TALON    = (250, 188, 70)
TALON_SH = (206, 140, 28)
BLUSH    = (255, 138, 126)
SMOKE    = (150, 150, 158)
GOLD     = (255, 206, 74)
GOLD_DK  = (208, 150, 30)


def S(v):
    return int(round(v * SS))


def A(rgb, a=255):
    return (rgb[0], rgb[1], rgb[2], a)


# --- hi-res primitives (coords in 120-space) --------------------------------
def oval(d, cx, cy, rx, ry, rgb, a=255):
    d.ellipse([S(cx - rx), S(cy - ry), S(cx + rx), S(cy + ry)], fill=A(rgb, a))


def poly(d, pts, rgb, a=255):
    d.polygon([(S(x), S(y)) for x, y in pts], fill=A(rgb, a))


def line(d, x0, y0, x1, y1, w, rgb, a=255):
    d.line([S(x0), S(y0), S(x1), S(y1)], fill=A(rgb, a), width=max(1, S(w)))


def arc(d, cx, cy, rx, ry, a0, a1, w, rgb):
    d.arc([S(cx - rx), S(cy - ry), S(cx + rx), S(cy + ry)], a0, a1,
          fill=A(rgb), width=max(1, S(w)))


# --- flames -----------------------------------------------------------------
def flame_up(d, x, y, w, h, sway=0.0):
    for sc, col in ((1.0, FL_R), (0.70, FL_O), (0.42, FL_Y)):
        ww, hh = w * sc, h * sc
        pts = [(x - ww / 2, y), (x - ww * 0.30, y - hh * 0.45),
               (x + sway * sc, y - hh), (x + ww * 0.30, y - hh * 0.45),
               (x + ww / 2, y), (x, y + hh * 0.14)]
        poly(d, pts, col)


def flame_dir(d, cx, cy, ang, w, h):
    """A flame whose tip points outward along `ang` (radians, 0 = +x)."""
    th = ang + math.pi / 2  # local tip points up (-y); rotate to ang
    ct, st = math.cos(th), math.sin(th)
    local = [(-w / 2, 0), (-w * 0.30, -h * 0.45), (0, -h),
             (w * 0.30, -h * 0.45), (w / 2, 0), (0, h * 0.14)]
    for sc, col in ((1.0, FL_R), (0.70, FL_O), (0.42, FL_Y)):
        pts = []
        for lx, ly in local:
            sx, sy = lx * sc, ly * sc
            pts.append((cx + sx * ct - sy * st, cy + sx * st + sy * ct))
        poly(d, pts, col)


# --- body parts -------------------------------------------------------------
def tail(d, cx, cy, spread=1.0, flick=0.0):
    # behind the body (to the LEFT, since we face right)
    for i, ang in enumerate((205, 222, 240)):
        a = math.radians(ang)
        bx, by = cx - 4, cy + 2
        flame_dir(d, bx + math.cos(a) * 6, by + math.sin(a) * 6,
                  a + flick * (0.1 * (i - 1)), 11 * spread, 20 * spread)


def wing(d, cx, cy, lift=0.0, spread=1.0):
    """Near wing on the body. lift raises it (flap/cheer)."""
    ang = -10 - lift * 55
    a = math.radians(ang)
    tipx, tipy = cx + math.cos(a) * 16 * spread, cy + math.sin(a) * 16 * spread
    # outlined wing: dark base then fill
    pts = [(cx - 2, cy - 8), (tipx, tipy - 2), (tipx + 2, tipy + 5),
           (cx + 6, cy + 9)]
    poly(d, pts, FEA_SH)
    inner = [(cx - 1, cy - 5), (tipx - 1, tipy), (cx + 5, cy + 7)]
    poly(d, inner, FEA)
    line(d, cx, cy - 4, tipx - 1, tipy, 1, FEA_SH)


def body(d, cx, cy, rx=22, ry=25):
    oval(d, cx, cy + 1, rx, ry, FEA_SH)                       # shadow base
    oval(d, cx, cy - ry * 0.10, rx * 0.97, ry * 0.93, FEA)    # main
    oval(d, cx - rx * 0.32, cy - ry * 0.34, rx * 0.55, ry * 0.5, FEA_HI)  # hi
    oval(d, cx + rx * 0.20, cy + ry * 0.30, rx * 0.58, ry * 0.6, BELLY)   # belly
    oval(d, cx + rx * 0.12, cy + ry * 0.14, rx * 0.36, ry * 0.4, BELLY_HI)


def feet(d, cx, cy, tuck=0.0):
    if tuck > 0.5:
        return
    for s in (-1, 1):
        fx = cx + s * 6
        line(d, fx, cy, fx, cy + 5, 2, TALON)
        line(d, fx, cy + 5, fx - 2, cy + 7, 1, TALON_SH)
        line(d, fx, cy + 5, fx + 2, cy + 7, 1, TALON_SH)


def scarf(d, cx, cy, flutter=0.0):
    # neck band
    oval(d, cx, cy, 13, 5, SCARF_SH)
    oval(d, cx, cy - 1, 12, 4, SCARF)
    oval(d, cx - 4, cy - 1.5, 5, 2, SCARF_HI)
    # fluttering end trailing behind (left)
    ex = cx - 12 - flutter * 3
    poly(d, [(cx - 8, cy), (ex, cy + 2 + flutter), (ex - 1, cy + 7 + flutter),
             (cx - 6, cy + 4)], SCARF_SH)
    poly(d, [(cx - 8, cy), (ex, cy + 2 + flutter), (cx - 6, cy + 3)], SCARF)


def crest(d, cx, cy, flick=0.0):
    flame_up(d, cx - 5, cy, 6, 11, sway=-1 + flick)
    flame_up(d, cx + 1, cy - 1, 8, 16, sway=flick)
    flame_up(d, cx + 6, cy, 6, 10, sway=1 + flick)


def beak(d, cx, cy):
    poly(d, [(cx, cy - 3), (cx + 9, cy + 1), (cx, cy + 3)], BEAK)
    poly(d, [(cx, cy + 1), (cx + 9, cy + 1), (cx, cy + 3)], BEAK_SH)


def face(d, cx, cy, expr="calm"):
    le, re = cx - 6, cx + 6      # eye centres
    ey = cy
    if expr in ("calm", "happy"):
        for ox, rr in ((le, 5.0), (re, 5.6)):
            oval(d, ox, ey, rr, rr + 0.6, EYE)
            oval(d, ox - 1.4, ey - 1.6, rr * 0.42, rr * 0.42, WHITE)
            oval(d, ox + 1.2, ey + 1.6, rr * 0.22, rr * 0.22, WHITE)
        oval(d, le - 4, ey + 5, 2.4, 1.6, BLUSH)
        oval(d, re + 4, ey + 5, 2.4, 1.6, BLUSH)
        beak(d, cx + 9, cy + 4)
    elif expr == "joy":
        for ox in (le, re):
            arc(d, ox, ey + 1, 3.2, 3.0, 185, 355, 1.4, EYE)
        oval(d, le - 4, ey + 5, 2.4, 1.6, BLUSH)
        oval(d, re + 4, ey + 5, 2.4, 1.6, BLUSH)
        # open happy beak
        poly(d, [(cx + 7, cy + 2), (cx + 16, cy + 5), (cx + 7, cy + 9)], BEAK)
        poly(d, [(cx + 7, cy + 6), (cx + 14, cy + 6), (cx + 7, cy + 9)], FL_R)
    elif expr in ("strain", "determined"):
        for ox, rr in ((le, 4.6), (re, 5.0)):
            oval(d, ox, ey + 1, rr, rr, EYE)
            oval(d, ox - 1.2, ey - 0.6, rr * 0.4, rr * 0.4, WHITE)
            # lowered brow lid
            poly(d, [(ox - rr - 1, ey - rr), (ox + rr + 1, ey - rr - 1.5),
                     (ox + rr + 1, ey - rr * 0.2), (ox - rr - 1, ey + rr * 0.2)],
                 FEA_SH)
        beak(d, cx + 9, cy + 4)
    elif expr == "star":
        for ox in (le, re):
            for k in range(4):
                aa = k * math.pi / 2
                line(d, ox, ey, ox + math.cos(aa) * 4, ey + math.sin(aa) * 4, 1.6, GOLD)
            oval(d, ox, ey, 1.6, 1.6, WHITE)
        poly(d, [(cx + 7, cy + 2), (cx + 16, cy + 5), (cx + 7, cy + 9)], BEAK)
    elif expr == "dizzy":
        for ox in (le, re):
            line(d, ox - 3, ey - 3, ox + 3, ey + 3, 1.4, EYE)
            line(d, ox - 3, ey + 3, ox + 3, ey - 3, 1.4, EYE)
        poly(d, [(cx + 7, cy + 4), (cx + 14, cy + 4), (cx + 10, cy + 8)], BEAK)
    elif expr == "sad":
        for ox, rr in ((le, 4.6), (re, 5.0)):
            oval(d, ox, ey + 1.5, rr, rr, EYE)
            oval(d, ox - 1.2, ey, rr * 0.4, rr * 0.4, WHITE)
        # brows up-sad
        line(d, le - 4, ey - 5, le + 2, ey - 3, 1.2, FEA_SH)
        line(d, re - 2, ey - 3, re + 4, ey - 5, 1.2, FEA_SH)
        line(d, re + 3, ey + 4, re + 4, ey + 8, 1.4, SCARF)   # tear
        beak(d, cx + 8, cy + 5)


# --- frame composers (face RIGHT; move rows flipped later) ------------------
def t_blank():
    tile = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    return tile, ImageDraw.Draw(tile)


def cph(i, n=6):
    return math.sin(i / n * math.tau)


def f_hover(i):
    tile, d = t_blank()
    bob = cph(i) * 2
    cy = 58 + bob
    crest(d, 58, 34 + bob, flick=cph(i) * 1.5)
    tail(d, 38, cy + 6, flick=cph(i))
    wing(d, 42, cy + 2, lift=0.12 + 0.08 * (i % 2))
    body(d, 58, cy)
    scarf(d, 56, cy + 9, flutter=0.6 + 0.4 * cph(i))
    feet(d, 58, cy + 24)
    face(d, 60, cy - 6, "calm")
    return tile


def f_move(i, hard=False):
    tile, d = t_blank()
    flut = cph(i) * (2.2 if hard else 1.4)
    cy = 58
    crest(d, 56, 33, flick=2 + flut if hard else 1 + flut)
    tail(d, 36, cy + 7, spread=1.2 if hard else 1.0, flick=2 + flut)
    wing(d, 42, cy + 1, lift=0.45 + 0.1 * (i % 2), spread=1.15)
    body(d, 58, cy)
    scarf(d, 55, cy + 9, flutter=1.6 + flut)
    feet(d, 58, cy + 24, tuck=0.6)
    face(d, 60, cy - 6, "strain" if hard else "determined")
    if hard:
        for k in range(2):
            flame_dir(d, 30 - k * 3, cy + 2 + k * 7, math.radians(210), 6, 12)
    return tile


def f_boost(i):
    tile, d = t_blank()
    cy = 58
    # flame aura ring (solid, outward) — the "bursts into flame" signature
    for k in range(9):
        ang = k / 9 * math.tau + i * 0.18
        flame_dir(d, 58 + math.cos(ang) * 24, cy + math.sin(ang) * 26, ang,
                  9 + 2 * ((k + i) % 2), 17 + 3 * ((k + i) % 3))
    tail(d, 36, cy + 7, spread=1.3, flick=cph(i) * 2)
    wing(d, 42, cy, lift=0.6, spread=1.25)
    body(d, 58, cy)
    crest(d, 57, 32, flick=cph(i) * 2)
    scarf(d, 55, cy + 9, flutter=2.0)
    face(d, 60, cy - 6, "joy")
    # flying embers
    for k in range(3):
        ex = 24 + ((k * 31 + i * 9) % 70)
        ey = 22 + ((k * 23 + i * 13) % 70)
        oval(d, ex, ey, 1.6, 1.6, FL_Y)
        oval(d, ex, ey + 2, 1.0, 1.0, FL_O)
    return tile


def f_cheer(i):
    tile, d = t_blank()
    cy = 56 - (i % 2)
    crest(d, 57, 31, flick=cph(i) * 2)
    tail(d, 37, cy + 8, spread=1.15)
    wing(d, 42, cy - 2, lift=0.95, spread=1.2)      # wings up
    body(d, 58, cy)
    scarf(d, 55, cy + 9, flutter=1.2)
    feet(d, 58, cy + 24)
    face(d, 60, cy - 6, "joy")
    if i % 2 == 0:
        flame_up(d, 24, 30, 5, 10)
        flame_up(d, 92, 32, 5, 10)
    return tile


def f_combo(i):
    tile, d = t_blank()
    cy = 56
    tier = i
    # escalating burst of flames around
    cnt = 5 + tier * 2
    for k in range(cnt):
        ang = k / cnt * math.tau
        rr = 22 + tier
        flame_dir(d, 58 + math.cos(ang) * rr, cy + math.sin(ang) * rr, ang,
                  8 + tier, 15 + tier * 2)
    tail(d, 37, cy + 7, spread=1.2)
    wing(d, 42, cy - 1, lift=0.7, spread=1.2)
    body(d, 58, cy)
    crest(d, 57, 31)
    scarf(d, 55, cy + 9, flutter=1.0)
    face(d, 60, cy - 6, "star" if tier >= 3 else "joy")
    return tile


def head_only(expr, extra=None):
    tile, d = t_blank()
    cy = 60
    crest(d, 58, 34)
    # head as a body but a touch bigger, no feet
    oval(d, 58, cy + 1, 24, 25, FEA_SH)
    oval(d, 58, cy - 2, 23, 23, FEA)
    oval(d, 58 - 8, cy - 9, 12, 11, FEA_HI)
    oval(d, 58 + 5, cy + 8, 14, 14, BELLY)
    scarf(d, 56, cy + 14, flutter=0.6)
    face(d, 60, cy - 4, expr)
    if extra:
        extra(d)
    return tile


def f_dizzy():
    def smoke(d):
        for k, (sx, sy, r) in enumerate(((42, 26, 4), (50, 20, 5), (60, 24, 4))):
            oval(d, sx, sy, r, r, SMOKE, a=235)
        for k in range(3):
            aa = k / 3 * math.tau
            line(d, 78 + math.cos(aa) * 6, 22 + math.sin(aa) * 3,
                 79 + math.cos(aa) * 6, 22 + math.sin(aa) * 3, 1.4, GOLD)
    return head_only("dizzy", smoke)


def f_sadcloud():
    def cloud(d):
        gy = 16
        for ox, r in ((-7, 6), (0, 7), (7, 6)):
            oval(d, 58 + ox, gy, r, r * 0.82, (150, 162, 184))
        oval(d, 58, gy - 2, 6, 5, (182, 196, 216))
        for k in range(4):
            rx = 50 + k * 5
            line(d, rx, gy + 7, rx - 1, gy + 13, 1.2, SCARF)
    return head_only("sad", cloud)


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
    # tiny flame instead of star
    flame_up(d, cx - 4, cy - 4, 5, 9)
    return tile


def f_crown():
    tile, d = t_blank()
    cx, cy = 58, 62
    pts = [(cx - 15, cy + 9), (cx - 15, cy - 7), (cx - 7, cy + 2), (cx, cy - 11),
           (cx + 7, cy + 2), (cx + 15, cy - 7), (cx + 15, cy + 9)]
    poly(d, pts, GOLD)
    d.rectangle([S(cx - 15), S(cy + 5), S(cx + 15), S(cy + 9)], fill=A(GOLD_DK))
    for jx, col in ((cx, FL_R), (cx - 9, SCARF), (cx + 9, SCARF)):
        oval(d, jx, cy + 4, 2, 2, col)
    for tx in (cx - 15, cx, cx + 15):
        ty = cy - 11 if tx == cx else cy - 7
        oval(d, tx, ty, 1.6, 1.6, FL_Y)
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
                 head_only("star"), head_only("sad")])

    big = Image.new("RGBA", (COLS * TILE, ROWS * TILE), (0, 0, 0, 0))
    for ry, row in enumerate(rows):
        for cx, tile in enumerate(row):
            tile = add_outline(tile)
            if ry in (1, 2):           # move / move_hard are natural-LEFT
                tile = tile.transpose(Image.FLIP_LEFT_RIGHT)
            big.paste(tile, (cx * TILE, ry * TILE), tile)

    # post-process to match cat/unicorn: downscale + median + quantize + hard alpha
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
