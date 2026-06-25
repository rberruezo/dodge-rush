#!/usr/bin/env python3
"""
Build the SOPLO skin sheet procedurally (no source art needed).

Soplo is a dandelion-seed sprite ("diente de leon"): a fuzzy white pappus ball
with a cute face, a short green stalk-body and tiny leaf-arms. Its fluff is its
propeller — the in-game faller concept made literal.

Output: public/assets/character_soplo.png — a uniform 6x7 grid of 120px cells,
drop-in compatible with character.png. Drawn on a 60px logical grid and
NEAREST-upscaled x2 for crisp, chunky pixels (game runs pixelArt: true).

Frame map (index = row*6 + col), matching CHARACTER_ANIMS / CHAR_FRAMES:
  row0  0-5   hover (front, faces RIGHT)        gentle bob + fluff sway
  row1  6-11  side flight calm  (faces LEFT)    lean + fluff trailing
  row2 12-17  side flight strain(faces LEFT)    hard lean + strained face
  row3 18-23  boost (faces RIGHT)               fluff spins, seeds + mint glow
  row4 24-29  cheer (faces RIGHT)               arms up, joyful
  row5 30-35  combo x1..x20 (faces RIGHT)       escalating celebration burst
  row6 36-41  dizzy, sad-cloud, trophy, crown, star-head, sad-head
"""
import math
import random
from PIL import Image, ImageDraw

OUT = "public/assets/character_soplo.png"
COLS, ROWS = 6, 7
LOGI = 60          # logical pixels per cell
SCALE = 2          # upscale factor -> 120px cells
CELL = LOGI * SCALE

# --- limited palette --------------------------------------------------------
WHITE    = (255, 255, 255, 255)
FLUFF_HI = (245, 250, 255, 255)
FLUFF_MID= (214, 226, 238, 255)
FLUFF_LO = (176, 194, 214, 255)
EYE      = (42, 36, 56, 255)
CHEEK    = (255, 158, 196, 230)
STEM     = (111, 191, 115, 255)
STEM_DK  = (74, 148, 86, 255)
MINT     = (143, 230, 210, 255)   # trail colour 0x8fe6d2
MINT_HI  = (200, 246, 236, 255)
GOLD     = (255, 210, 74, 255)
GOLD_DK  = (210, 150, 30, 255)

random.seed(7)


def new_cell():
    return Image.new("RGBA", (LOGI, LOGI), (0, 0, 0, 0))


# --- primitives -------------------------------------------------------------
def disc(d, cx, cy, r, color):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color)


def fluff_ball(d, cx, cy, r, sway=0.0, n=15, fil=1.0, spin=0.0, color=None):
    """A fuzzy pappus ball: soft shaded core + radiating filaments with tip dots.
    `sway` bends filaments sideways, `spin` rotates the whole crown (boost),
    `fil` scales filament length (1.0 = normal, >1 = puffed)."""
    body = color or FLUFF_MID
    # radiating filaments (behind + around the core)
    for i in range(n):
        a = spin + (i / n) * math.tau
        bend = math.sin(a * 1.0) * sway
        length = r * (0.55 + 0.45 * fil) * (0.85 + 0.3 * ((i * 7) % 5) / 5.0)
        ix, iy = cx + math.cos(a) * (r * 0.72), cy + math.sin(a) * (r * 0.72)
        ox = cx + math.cos(a) * (r * 0.72 + length) + bend
        oy = cy + math.sin(a) * (r * 0.72 + length)
        d.line((ix, iy, ox, oy), fill=FLUFF_LO if i % 3 == 0 else FLUFF_MID, width=1)
        d.point((round(ox), round(oy)), fill=WHITE)
    # soft core with simple shading
    disc(d, cx, cy, r, body)
    disc(d, cx - r * 0.28, cy - r * 0.30, int(r * 0.7), FLUFF_HI)
    # a few sparse seed flecks for texture
    for i in range(5):
        a = i / 5 * math.tau + 0.6
        d.point((round(cx + math.cos(a) * r * 0.5), round(cy + math.sin(a) * r * 0.5)),
                fill=FLUFF_LO)


def face(d, cx, cy, expr="calm", look=1):
    """Draw the face on the ball. look: +1 faces right, -1 faces left."""
    ex = 4.0          # eye spacing
    ey = cy
    lx, rx = cx - ex, cx + ex
    if expr in ("calm", "happy"):
        disc(d, lx, ey, 2, EYE)
        disc(d, rx, ey, 2, EYE)
        d.point((round(lx), round(ey - 1)), fill=WHITE)
        d.point((round(rx), round(ey - 1)), fill=WHITE)
        disc(d, lx - 1, ey + 3, 1, CHEEK)
        disc(d, rx + 1, ey + 3, 1, CHEEK)
        if expr == "happy":
            d.arc((cx - 4, cy + 1, cx + 4, cy + 7), 20, 160, fill=EYE, width=1)
        else:
            d.arc((cx - 3, cy + 2, cx + 3, cy + 6), 20, 160, fill=EYE, width=1)
    elif expr == "joy":  # closed happy eyes ^_^ + open smile
        d.arc((lx - 2, ey - 1, lx + 2, ey + 3), 180, 360, fill=EYE, width=1)
        d.arc((rx - 2, ey - 1, rx + 2, ey + 3), 180, 360, fill=EYE, width=1)
        d.pieslice((cx - 3, cy + 2, cx + 3, cy + 7), 10, 170, fill=EYE)
        d.point((round(cx), round(cy + 6)), fill=CHEEK)  # tiny tongue
        disc(d, lx - 1, ey + 3, 1, CHEEK)
        disc(d, rx + 1, ey + 3, 1, CHEEK)
    elif expr == "strain":  # focused squint + gritted line
        d.line((lx - 2, ey, lx + 2, ey + 1), fill=EYE, width=1)
        d.line((rx - 2, ey + 1, rx + 2, ey), fill=EYE, width=1)
        d.line((cx - 3, cy + 4, cx + 3, cy + 4), fill=EYE, width=1)
    elif expr == "dizzy":  # X eyes
        for (ox) in (lx, rx):
            d.line((ox - 2, ey - 2, ox + 2, ey + 2), fill=EYE, width=1)
            d.line((ox - 2, ey + 2, ox + 2, ey - 2), fill=EYE, width=1)
        d.arc((cx - 3, cy + 5, cx + 3, cy + 8), 0, 180, fill=EYE, width=1)
    elif expr == "sad":
        disc(d, lx, ey + 1, 2, EYE)
        disc(d, rx, ey + 1, 2, EYE)
        d.arc((cx - 3, cy + 5, cx + 3, cy + 9), 180, 360, fill=EYE, width=1)  # frown
        d.line((rx + 1, ey + 2, rx + 2, ey + 5), fill=MINT, width=1)          # tear
    elif expr == "star":  # sparkle eyes + big grin
        for ox in (lx, rx):
            d.line((ox - 2, ey, ox + 2, ey), fill=GOLD, width=1)
            d.line((ox, ey - 2, ox, ey + 2), fill=GOLD, width=1)
            d.point((round(ox), round(ey)), fill=WHITE)
        d.pieslice((cx - 3, cy + 2, cx + 3, cy + 7), 10, 170, fill=EYE)
        d.point((round(cx), round(cy + 6)), fill=CHEEK)


def stalk(d, cx, top, expr="calm", arms="side", lean=0.0):
    """Short green stalk-body with leaf-arms and tiny feet. lean shifts the body."""
    bx = cx + lean
    d.line((cx, top, bx, top + 12), fill=STEM_DK, width=2)
    d.line((cx, top, bx, top + 12), fill=STEM, width=1)
    # feet
    d.line((bx - 3, top + 12, bx - 1, top + 13), fill=STEM_DK, width=1)
    d.line((bx + 1, top + 13, bx + 3, top + 12), fill=STEM_DK, width=1)
    # leaf-arms
    if arms == "up":
        for s in (-1, 1):
            d.line((bx, top + 4, bx + s * 5, top - 3), fill=STEM, width=2)
            disc(d, bx + s * 6, top - 4, 2, STEM_DK)
    elif arms == "forward":  # both reaching the facing direction (+x = right)
        for off in (3, 6):
            d.line((bx, top + 5, bx + 6, top + 2 + off * 0.2), fill=STEM, width=2)
        disc(d, bx + 7, top + 4, 2, STEM_DK)
    else:  # side
        for s in (-1, 1):
            d.line((bx, top + 5, bx + s * 5, top + 7), fill=STEM, width=2)
            disc(d, bx + s * 6, top + 8, 2, STEM_DK)


def seed_sparkle(d, x, y, color=MINT):
    """A tiny flying dandelion seed / sparkle."""
    d.line((x, y, x, y + 3), fill=STEM_DK, width=1)
    d.point((x, y), fill=color)
    d.point((x - 1, y - 1), fill=MINT_HI)
    d.point((x + 1, y - 1), fill=MINT_HI)
    d.point((x, y - 2), fill=color)


def sparkle(d, x, y, s=2, color=WHITE):
    d.line((x - s, y, x + s, y), fill=color, width=1)
    d.line((x, y - s, x, y + s), fill=color, width=1)


# --- frame composers --------------------------------------------------------
def f_hover(i):
    c = new_cell()
    d = ImageDraw.Draw(c)
    bob = round(math.sin(i / 6 * math.tau) * 2)
    sway = math.sin(i / 6 * math.tau) * 2.0
    cx, cy = 30, 22 + bob
    fluff_ball(d, cx, cy, 14, sway=sway)
    face(d, cx, cy + 1, "calm")
    stalk(d, cx, cy + 14, arms="side")
    return c


def f_move(i, hard=False):
    """Faces RIGHT here; tile is flipped to LEFT by the caller (natural-left)."""
    c = new_cell()
    d = ImageDraw.Draw(c)
    lean = 5 if hard else 3
    flut = math.sin(i / 6 * math.tau) * (3 if hard else 2)
    cx, cy = 28 - lean // 2, 22
    # fluff swept backwards (to the left = behind, since we face right)
    fluff_ball(d, cx, cy, 14 if not hard else 13, sway=-(4 + flut) if not hard else -(6 + flut))
    face(d, cx + 1, cy + 1, "strain" if hard else "calm")
    stalk(d, cx, cy + 14, arms="forward", lean=lean)
    if hard:
        for k in range(2):  # a couple of seeds peeling off under strain
            seed_sparkle(d, 46 + k * 4, 18 + k * 8 + round(flut))
    return c


def f_boost(i):
    c = new_cell()
    d = ImageDraw.Draw(c)
    cx, cy = 30, 22
    # mint glow aura
    for r, col in ((20, (143, 230, 210, 60)), (16, (143, 230, 210, 90))):
        disc(d, cx, cy, r, col)
    fluff_ball(d, cx, cy, 14, spin=i / 6 * math.tau, fil=1.15)
    face(d, cx, cy + 1, "joy")
    stalk(d, cx, cy + 14, arms="up")
    # streaming seeds + sparkles
    for k in range(4):
        ang = i / 6 * math.tau + k * 1.4
        sx = round(cx + math.cos(ang) * 18)
        sy = round(cy + 16 + (k * 6 + i * 2) % 22)
        seed_sparkle(d, sx, sy)
    sparkle(d, 14, 14, 2, MINT_HI)
    sparkle(d, 46, 30, 2, WHITE)
    return c


def f_cheer(i):
    c = new_cell()
    d = ImageDraw.Draw(c)
    puff = 1.0 + (i % 3) * 0.12
    cx, cy = 30, 22 - (i % 2)
    fluff_ball(d, cx, cy, 15, fil=puff, sway=math.sin(i) * 1.5)
    face(d, cx, cy + 1, "joy")
    stalk(d, cx, cy + 15, arms="up")
    if i % 2 == 0:
        seed_sparkle(d, 16, 16)
        seed_sparkle(d, 44, 18)
    sparkle(d, 12, 28, 2, MINT_HI)
    sparkle(d, 48, 24, 2, MINT_HI)
    return c


def f_combo(i):
    """Escalating celebration: more/larger bursts and a shift toward gold."""
    c = new_cell()
    d = ImageDraw.Draw(c)
    cx, cy = 30, 24
    tier = i  # 0..5  -> x1..x20
    glow_col = (GOLD if tier >= 3 else MINT)
    gr, gg, gb, _ = glow_col
    for r, a in ((19, 60), (15, 100)):
        disc(d, cx, cy, r + tier, (gr, gg, gb, a))
    fluff_ball(d, cx, cy, 14, fil=1.0 + tier * 0.06)
    face(d, cx, cy + 1, "star" if tier >= 3 else "joy")
    # burst ring of seeds/sparkles, denser with tier
    count = 4 + tier * 2
    for k in range(count):
        ang = k / count * math.tau
        rr = 20 + tier
        sx, sy = round(cx + math.cos(ang) * rr), round(cy + math.sin(ang) * rr)
        if tier >= 4:
            sparkle(d, sx, sy, 2, GOLD)
        else:
            seed_sparkle(d, sx, sy, MINT_HI if tier < 2 else MINT)
    return c


def head_only(expr, extra=None):
    c = new_cell()
    d = ImageDraw.Draw(c)
    cx, cy = 30, 26
    fluff_ball(d, cx, cy, 15, sway=(3 if expr == "dizzy" else 0),
               fil=(0.8 if expr in ("dizzy", "sad") else 1.0))
    face(d, cx, cy + 1, expr)
    if extra:
        extra(d, cx, cy)
    return c


def f_dizzy():
    def stars(d, cx, cy):
        for k in range(3):
            a = k / 3 * math.tau
            sparkle(d, round(cx + math.cos(a) * 16), round(cy - 14 + math.sin(a) * 4), 1, GOLD)
    return head_only("dizzy", stars)


def f_sadcloud():
    def cloud(d, cx, cy):
        gy = 8
        for (ox, r) in ((-6, 5), (0, 6), (6, 5)):
            disc(d, cx + ox, gy, r, (150, 166, 186, 255))
        disc(d, cx, gy - 2, 5, (180, 196, 214, 255))
        for k in range(4):  # drizzle
            rx = cx - 7 + k * 5
            d.line((rx, gy + 6, rx - 1, gy + 11), fill=MINT, width=1)
    return head_only("sad", cloud)


def f_trophy():
    c = new_cell()
    d = ImageDraw.Draw(c)
    cx, cy = 30, 28
    # cup
    d.pieslice((cx - 10, cy - 12, cx + 10, cy + 6), 0, 180, fill=GOLD)
    d.rectangle((cx - 10, cy - 12, cx + 10, cy - 4), fill=GOLD)
    d.ellipse((cx - 10, cy - 15, cx + 10, cy - 9), fill=GOLD_DK)
    # handles
    d.arc((cx - 16, cy - 12, cx - 6, cy + 2), 60, 300, fill=GOLD_DK, width=2)
    d.arc((cx + 6, cy - 12, cx + 16, cy + 2), 240, 480, fill=GOLD_DK, width=2)
    # stem + base
    d.rectangle((cx - 2, cy + 5, cx + 2, cy + 11), fill=GOLD_DK)
    d.rectangle((cx - 7, cy + 11, cx + 7, cy + 15), fill=GOLD)
    sparkle(d, cx - 4, cy - 6, 2, WHITE)
    return c


def f_crown():
    c = new_cell()
    d = ImageDraw.Draw(c)
    cx, cy = 30, 30
    pts = [(cx - 13, cy + 8), (cx - 13, cy - 6), (cx - 6, cy + 2), (cx, cy - 9),
           (cx + 6, cy + 2), (cx + 13, cy - 6), (cx + 13, cy + 8)]
    d.polygon(pts, fill=GOLD)
    d.line((cx - 13, cy + 8, cx + 13, cy + 8), fill=GOLD_DK, width=2)
    for (jx, jy, col) in ((cx, cy + 3, (255, 90, 140, 255)), (cx - 8, cy + 4, MINT),
                          (cx + 8, cy + 4, MINT)):
        disc(d, jx, jy, 1, col)
    for (tx, ty) in ((cx - 13, cy - 6), (cx, cy - 9), (cx + 13, cy - 6)):
        d.point((tx, ty), fill=WHITE)
    return c


# --- assemble ---------------------------------------------------------------
def build():
    sheet = Image.new("RGBA", (COLS * CELL, ROWS * CELL), (0, 0, 0, 0))

    rows = []
    rows.append([f_hover(i) for i in range(6)])                 # row0 hover
    rows.append([f_move(i, hard=False) for i in range(6)])      # row1 move
    rows.append([f_move(i, hard=True) for i in range(6)])       # row2 move_hard
    boost = [f_boost(i) for i in range(6)]
    rows.append(boost)                                          # row3 boost
    rows.append([f_cheer(i) for i in range(6)])                 # row4 cheer
    rows.append([f_combo(i) for i in range(6)])                 # row5 combo
    rows.append([f_dizzy(), f_sadcloud(), f_trophy(), f_crown(),  # row6 specials
                 head_only("star"), head_only("sad")])

    # move / move_hard are natural-LEFT: flip the right-facing art horizontally
    for r in (1, 2):
        rows[r] = [t.transpose(Image.FLIP_LEFT_RIGHT) for t in rows[r]]

    for ry, row in enumerate(rows):
        for cx, tile in enumerate(row):
            big = tile.resize((CELL, CELL), Image.NEAREST)
            sheet.paste(big, (cx * CELL, ry * CELL), big)

    sheet.save(OUT)
    print(f"wrote {OUT} {sheet.size}")


if __name__ == "__main__":
    build()
