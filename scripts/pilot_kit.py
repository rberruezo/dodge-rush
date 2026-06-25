#!/usr/bin/env python3
"""
Shared "propeller-pilot" kit for Dodge Rush skins, so new characters read as the
same universe as character / cat / unicorn. Common DNA captured here:
  - propeller on a short shaft above the head
  - signature-colour aviator hood that frames a cream face
  - round headphone pods on the helmet sides
  - aviator goggles on the brow
  - chunky padded flight suit with teal trim + chest panel
  - rocket-boot flame exhaust
  - chibi proportions, big shiny eyes, blush, dark outline + cel shading

A character supplies a palette + a few "species" hooks (helmet ears/horns,
crest, tail) and a pose; this module draws the rest. Frames are drawn at SS x
resolution facing RIGHT; the builder adds the unified outline, flips the
move rows, downscales + median + quantizes (same post-process as build-skins).
"""
import math
from PIL import Image, ImageDraw, ImageFilter

SS = 3
CELL = 120
TILE = CELL * SS

# shared (non-signature) colours
OUTLINE  = (46, 30, 30)
CREAM    = (255, 234, 198)
CREAM_SH = (236, 198, 150)
CREAM_HI = (255, 246, 224)
TEAL     = (78, 202, 190)
TEAL_SH  = (40, 150, 142)
TEAL_HI  = (158, 230, 220)
GLASS    = (120, 222, 212)
GLASS_HI = (210, 250, 244)
EYE      = (44, 34, 40)
WHITE    = (255, 255, 255)
BLUSH    = (255, 150, 150)
GOLD     = (255, 208, 84)
GOLD_HI  = (255, 232, 150)
GOLD_DK  = (206, 150, 32)
FL_Y     = (255, 226, 104)
FL_O     = (252, 138, 40)
FL_R     = (230, 62, 30)
DARK     = (60, 44, 52)   # goggle strap / dark accents


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


def rrect(d, x0, y0, x1, y1, r, rgb):
    d.rounded_rectangle([S(x0), S(y0), S(x1), S(y1)], radius=S(r), fill=A(rgb))


# --- flames (reused by crests / jets / boost) -------------------------------
def flame_up(d, x, y, w, h, sway=0.0):
    for sc, col in ((1.0, FL_R), (0.70, FL_O), (0.42, FL_Y)):
        ww, hh = w * sc, h * sc
        poly(d, [(x - ww / 2, y), (x - ww * 0.30, y - hh * 0.45),
                 (x + sway * sc, y - hh), (x + ww * 0.30, y - hh * 0.45),
                 (x + ww / 2, y), (x, y + hh * 0.14)], col)


def flame_dir(d, cx, cy, ang, w, h):
    th = ang + math.pi / 2
    ct, st = math.cos(th), math.sin(th)
    local = [(-w / 2, 0), (-w * 0.30, -h * 0.45), (0, -h),
             (w * 0.30, -h * 0.45), (w / 2, 0), (0, h * 0.14)]
    for sc, col in ((1.0, FL_R), (0.70, FL_O), (0.42, FL_Y)):
        poly(d, [(cx + lx * sc * ct - ly * sc * st, cy + lx * sc * st + ly * sc * ct)
                 for lx, ly in local], col)


# --- kit parts (facing RIGHT) ----------------------------------------------
def jet(d, x, y, level=1.0):
    """Rocket-boot exhaust, pointing down-back (down-left)."""
    flame_dir(d, x, y, math.radians(118), 7 * level, 18 * level)
    flame_dir(d, x + 4, y + 1, math.radians(108), 5 * level, 12 * level)


def helmet(d, hx, hy, R, sig, sig_hi, sig_sh):
    oval(d, hx, hy + 1, R, R, sig_sh)
    oval(d, hx, hy - R * 0.08, R * 0.96, R * 0.94, sig)
    oval(d, hx - R * 0.34, hy - R * 0.36, R * 0.5, R * 0.46, sig_hi)


def pods(d, hx, hy, R):
    for s in (-1, 1):
        px = hx + s * (R - 2)
        py = hy + 3
        oval(d, px, py, 7.5, 8.5, TEAL_SH)
        oval(d, px, py, 6, 7, TEAL)
        oval(d, px, py, 3, 3.6, CREAM)
        oval(d, px - 1, py - 1.4, 1.2, 1.4, CREAM_HI)


def propeller(d, hx, topy, phase=0.0, col=GOLD, col_dk=GOLD_DK, col_hi=GOLD_HI):
    # shaft
    line(d, hx, topy + 8, hx, topy, 1.8, col_dk)
    oval(d, hx, topy + 8, 2, 2, col_dk)
    # spinning blade: width breathes with phase; faint blur disc when fast
    half = max(4.0, 15 * abs(math.cos(phase)))
    if half < 9:
        oval(d, hx, topy - 1, 15, 3.4, col, a=90)  # motion blur
    for s in (-1, 1):
        poly(d, [(hx, topy - 2.4), (hx + s * half, topy - 3.6),
                 (hx + s * half, topy + 1.2), (hx, topy + 1.6)], col)
        line(d, hx, topy - 2, hx + s * half, topy - 2.6, 0.8, col_hi)
    oval(d, hx, topy - 1, 2.4, 2.4, col_dk)
    oval(d, hx - 0.6, topy - 1.6, 0.9, 0.9, col_hi)


def face(d, fx, fy, expr="calm", eyescale=1.0):
    """Cream face patch framed by the helmet, with eyes + mouth."""
    oval(d, fx, fy, 14, 15, CREAM_SH)
    oval(d, fx, fy - 0.6, 13, 14, CREAM)
    oval(d, fx - 4, fy - 5, 6, 5.5, CREAM_HI)
    le, re = fx - 5, fx + 5
    ey = fy + 1
    if expr in ("calm", "happy"):
        for ox, rr in ((le, 5.0 * eyescale), (re, 5.4 * eyescale)):
            oval(d, ox, ey, rr, rr + 0.6, EYE)
            oval(d, ox - 1.5, ey - 1.8, rr * 0.42, rr * 0.42, WHITE)
            oval(d, ox + 1.3, ey + 1.8, rr * 0.22, rr * 0.22, WHITE)
        oval(d, le - 4, ey + 5, 2.6, 1.7, BLUSH)
        oval(d, re + 4, ey + 5, 2.6, 1.7, BLUSH)
        arc(d, fx, ey + 5, 2.6, 2.2, 25, 155, 1.4, EYE)
    elif expr == "joy":
        for ox in (le, re):
            arc(d, ox, ey + 1, 3.2, 3.0, 188, 352, 1.5, EYE)
        oval(d, le - 4, ey + 5, 2.6, 1.7, BLUSH)
        oval(d, re + 4, ey + 5, 2.6, 1.7, BLUSH)
        d.pieslice([S(fx - 3.2), S(ey + 3), S(fx + 3.2), S(ey + 9)], 10, 170, fill=A(EYE))
        oval(d, fx, ey + 7, 1.0, 1.0, BLUSH)
    elif expr in ("strain", "determined"):
        for ox, rr in ((le, 4.6), (re, 4.8)):
            oval(d, ox, ey + 1, rr, rr, EYE)
            oval(d, ox - 1.2, ey - 0.4, rr * 0.4, rr * 0.4, WHITE)
            poly(d, [(ox - rr - 1, ey - rr), (ox + rr + 1, ey - rr - 1.4),
                     (ox + rr + 1, ey - rr * 0.2), (ox - rr - 1, ey + rr * 0.1)],
                 CREAM_SH)
        line(d, fx - 3, ey + 5, fx + 3, ey + 5, 1.5, EYE)
    elif expr == "star":
        for ox in (le, re):
            for k in range(4):
                aa = k * math.pi / 4
                line(d, ox, ey, ox + math.cos(aa) * 4, ey + math.sin(aa) * 4, 1.4, GOLD)
            oval(d, ox, ey, 1.6, 1.6, WHITE)
        d.pieslice([S(fx - 3.2), S(ey + 3), S(fx + 3.2), S(ey + 9)], 10, 170, fill=A(EYE))
    elif expr == "dizzy":
        for ox in (le, re):
            line(d, ox - 3, ey - 3, ox + 3, ey + 3, 1.5, EYE)
            line(d, ox - 3, ey + 3, ox + 3, ey - 3, 1.5, EYE)
        arc(d, fx, ey + 6, 3, 2, 0, 180, 1.4, EYE)
    elif expr == "sad":
        for ox, rr in ((le, 4.6), (re, 4.8)):
            oval(d, ox, ey + 1.5, rr, rr, EYE)
            oval(d, ox - 1.2, ey, rr * 0.4, rr * 0.4, WHITE)
        line(d, le - 4, ey - 5, le + 2, ey - 3, 1.2, CREAM_SH)
        line(d, re - 2, ey - 3, re + 4, ey - 5, 1.2, CREAM_SH)
        arc(d, fx, ey + 7, 3, 2.4, 180, 360, 1.4, EYE)
        line(d, re + 3, ey + 4, re + 4, ey + 8, 1.4, TEAL)


def goggles(d, fx, fy):
    """Aviator goggles pushed up on the brow."""
    line(d, fx - 13, fy - 8, fx + 12, fy - 9, 3.2, DARK)
    for ox in (fx - 6, fx + 6):
        oval(d, ox, fy - 9, 4.4, 4.2, DARK)
        oval(d, ox, fy - 9, 3.2, 3.0, GLASS)
        oval(d, ox - 1.2, fy - 10, 1.2, 1.1, GLASS_HI)


def body(d, bx, by, sig, sig_hi, sig_sh):
    # padded torso
    oval(d, bx, by + 1, 16, 18, sig_sh)
    oval(d, bx, by - 1, 15, 17, sig)
    oval(d, bx - 5, by - 6, 6, 7, sig_hi)
    # teal belt + chest panel
    rrect(d, bx - 13, by + 4, bx + 13, by + 9, 2.5, TEAL_SH)
    rrect(d, bx - 13, by + 3, bx + 13, by + 8, 2.5, TEAL)
    rrect(d, bx - 5, by - 8, bx + 5, by + 1, 2.5, TEAL_SH)
    rrect(d, bx - 4, by - 8, bx + 4, by, 2, CREAM)
    oval(d, bx, by - 4, 2.2, 2.2, TEAL)


def arm(d, sx, sy, ex, ey, sig, sig_sh):
    """Padded marshmallow arm from shoulder (sx,sy) to glove (ex,ey)."""
    mx, my = (sx + ex) / 2, (sy + ey) / 2
    for (px, py, r) in ((sx, sy, 5), (mx, my, 4.4), (ex, ey, 4.2)):
        oval(d, px, py, r + 0.6, r + 0.6, sig_sh)
        oval(d, px, py, r, r, sig)
    oval(d, ex, ey, 3.6, 3.6, TEAL_SH)   # glove
    oval(d, ex, ey, 2.8, 2.8, CREAM)
    oval(d, ex - 1, ey - 1, 1, 1, CREAM_HI)


def legs(d, bx, by, sig, sig_sh):
    for s in (-1, 1):
        lx = bx + s * 6
        oval(d, lx, by + 14, 5, 5.5, sig_sh)
        oval(d, lx, by + 13, 4.2, 4.6, sig)
        # boot
        oval(d, lx, by + 18, 4.6, 4, TEAL_SH)
        oval(d, lx + s * 1.5, by + 18, 3.6, 3.2, TEAL)
        oval(d, lx, by + 17, 2.4, 1.6, CREAM)


def crown(d, hx, topy):
    """Gold crown resting on the helmet top (`topy` = helmet-top y)."""
    by = topy - 1                     # band centre, just above the helmet
    pts = [(hx - 13, by + 4), (hx - 13, by - 6), (hx - 6.5, by + 1),
           (hx, by - 10), (hx + 6.5, by + 1), (hx + 13, by - 6), (hx + 13, by + 4)]
    poly(d, pts, GOLD)
    d.rectangle([S(hx - 13), S(by + 1), S(hx + 13), S(by + 4)], fill=A(GOLD_DK))
    line(d, hx - 12, by + 2.5, hx + 12, by + 2.5, 0.8, GOLD_HI)
    for jx, col in ((hx, FL_R), (hx - 8, TEAL), (hx + 8, TEAL)):
        oval(d, jx, by + 2.5, 1.6, 1.6, col)
    for tx in (hx - 13, hx, hx + 13):
        ty = by - 10 if tx == hx else by - 6
        oval(d, tx, ty, 1.8, 1.8, GOLD_HI)


def trophy_held(d, bx, by):
    """A gold trophy held up in front of the chest."""
    cx, cy = bx, by - 2
    d.pieslice([S(cx - 9), S(cy - 11), S(cx + 9), S(cy + 5)], 0, 180, fill=A(GOLD))
    d.rectangle([S(cx - 9), S(cy - 11), S(cx + 9), S(cy - 3)], fill=A(GOLD))
    oval(d, cx, cy - 12, 9, 3, GOLD_DK)
    arc(d, cx - 12, cy - 6, 6, 7, 60, 300, 1.8, GOLD_DK)
    arc(d, cx + 12, cy - 6, 6, 7, 240, 480, 1.8, GOLD_DK)
    d.rectangle([S(cx - 2.4), S(cy + 4), S(cx + 2.4), S(cy + 9)], fill=A(GOLD_DK))
    d.rectangle([S(cx - 7), S(cy + 9), S(cx + 7), S(cy + 13)], fill=A(GOLD))
    oval(d, cx - 3, cy - 4, 2, 3, GOLD_HI)
    line(d, cx - 6, cy - 9, cx - 6, cy + 13, 0.8, GOLD_HI)


# --- outline + post-process (shared by all pilot skins) ---------------------
def add_outline(tile, size=9, rgb=OUTLINE):
    a = tile.getchannel("A")
    da = a.filter(ImageFilter.MaxFilter(size))
    base = Image.new("RGBA", tile.size, (0, 0, 0, 0))
    solid = Image.new("RGBA", tile.size, A(rgb))
    base.paste(solid, (0, 0), da)
    base.alpha_composite(tile)
    return base


def finish(rows, out, cols=6, srows=7, colors=40, alpha_cut=128, outline=OUTLINE):
    big = Image.new("RGBA", (cols * TILE, srows * TILE), (0, 0, 0, 0))
    for ry, row in enumerate(rows):
        for cx, tile in enumerate(row):
            tile = add_outline(tile, rgb=outline)
            if ry in (1, 2):
                tile = tile.transpose(Image.FLIP_LEFT_RIGHT)
            big.paste(tile, (cx * TILE, ry * TILE), tile)
    small = big.resize((cols * CELL, srows * CELL), Image.LANCZOS)
    r, g, b, al = small.split()
    rgb = Image.merge("RGB", (r, g, b)).filter(ImageFilter.MedianFilter(3))
    pal = rgb.quantize(colors=colors, method=Image.MEDIANCUT,
                       dither=Image.NONE).convert("RGB")
    pr, pg, pb = pal.split()
    hard_a = al.point(lambda v: 255 if v >= alpha_cut else 0)
    Image.merge("RGBA", (pr, pg, pb, hard_a)).save(out)
    print(f"wrote {out} ({cols*CELL}x{srows*CELL})")


def blank():
    t = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    return t, ImageDraw.Draw(t)
