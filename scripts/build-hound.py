#!/usr/bin/env python3
"""
PERRITO VIEJITO — a propeller-PILOT old hound dog (think the droopy bloodhound
from Lady and the Tramp). Wears the shared kit from pilot_kit.py so it reads as
the same universe as character / cat / unicorn / phoenix / dragon. Dog-flavoured
variation: long floppy ears hanging down past the face, a greying snout with a
dark nose + saggy jowls, bushy old-timer brows, and a low furry tail with a
white tip. Trophy/crown frames show the character itself.

Output: public/assets/character_hound.png — 6x7 / 120px, drop-in.
"""
import math
import pilot_kit as K
from pilot_kit import (blank, finish, jet, helmet, pods, propeller, face,
                       goggles, body, arm, legs, crown, trophy_held,
                       oval, poly, line, arc,
                       CREAM, CREAM_SH, CREAM_HI, WHITE)

OUT = "public/assets/character_hound.png"

# signature palette (warm caramel-tan hound)
SIG     = (196, 138, 86)
SIG_HI  = (228, 184, 130)
SIG_SH  = (146, 96, 56)
OUTLINE = (48, 32, 26)

# ears — a deeper liver-brown so they read apart from the tan suit
EAR     = (132, 84, 50)
EAR_SH  = (98, 60, 36)
EAR_HI  = (170, 116, 76)

# greying muzzle (the "viejito" tell) + nose
MUZ     = (236, 224, 208)
MUZ_SH  = (198, 182, 162)
MUZ_HI  = (252, 246, 236)
NOSE    = (58, 44, 44)
NOSE_HI = (120, 104, 104)
BROW    = (206, 198, 188)   # bushy grey eyebrows

RH = 22


def cph(i, n=6):
    return math.sin(i / n * math.tau)


def ears(d, hx, hy, R, lift=0.0):
    """Long floppy hound ears hanging from under the helmet, framing the face.
    `lift` lets the ear tips flutter up a touch with speed/motion."""
    for s in (-1, 1):
        ax = hx + s * (R - 3)
        ay = hy - R * 0.18
        seg = [(ax, ay),
               (ax + s * 2, ay + 8),
               (ax + s * 4 + s * lift, ay + 16 - lift * 0.5),
               (ax + s * 5 + s * lift * 1.5, ay + 23 - lift)]
        radii = [5.6, 5.2, 4.5, 3.4]
        for (px, py), r in zip(seg, radii):
            oval(d, px + s * 0.5, py + 0.8, r + 0.4, r + 0.4, EAR_SH)
            oval(d, px, py, r, r, EAR)
        oval(d, ax + s * 0.5, ay + 3, 2.2, 3.2, EAR_HI)   # soft sheen near root


def snout(d, fx, fy):
    """Greying old-dog muzzle pushed out below the eyes: jowls, split + nose."""
    my = fy + 9
    oval(d, fx, my + 1, 9.5, 7.2, CREAM_SH)      # jowl shadow
    oval(d, fx - 6, my + 3, 4.2, 4.6, MUZ_SH)    # saggy cheek lobes
    oval(d, fx + 6, my + 3, 4.2, 4.6, MUZ_SH)
    oval(d, fx, my, 9, 6.6, MUZ)                 # grey muzzle pad
    oval(d, fx - 3, my - 1, 3.4, 2.8, MUZ_HI)
    # muzzle split + gentle smile
    line(d, fx, my - 2, fx, my + 4, 1.0, MUZ_SH)
    arc(d, fx - 3.4, my + 3, 3.4, 2.4, 20, 160, 1.1, NOSE)
    arc(d, fx + 3.4, my + 3, 3.4, 2.4, 20, 160, 1.1, NOSE)
    # big dark nose
    oval(d, fx, my - 3, 3.4, 2.8, NOSE)
    oval(d, fx - 1, my - 3.9, 1.1, 0.9, NOSE_HI)


def brows(d, fx, fy):
    """Bushy grey old-timer eyebrows, drooping at the outer corners."""
    le, re = fx - 6, fx + 6
    poly(d, [(le - 4.5, fy - 3), (le + 3, fy - 6),
             (le + 3.5, fy - 4), (le - 4, fy - 1.5)], BROW)
    poly(d, [(re + 4.5, fy - 3), (re - 3, fy - 6),
             (re - 3.5, fy - 4), (re + 4, fy - 1.5)], BROW)


def htail(d, x, y, wag=0.0):
    """Low, furry hound tail curling down-back, with a white tip."""
    seg = [(x, y), (x - 5, y + 4), (x - 8, y + 9), (x - 7 + wag, y + 14)]
    radii = [4.8, 4.0, 3.2, 2.5]
    for (px, py), r in zip(seg, radii):
        oval(d, px - 0.4, py + 0.5, r + 0.4, r + 0.4, SIG_SH)
        oval(d, px, py, r, r, SIG)
    tx, ty = seg[-1]
    oval(d, tx, ty + 1, 2.6, 2.6, WHITE)


def pilot(d, bob=0.0, lean=0.0, arms="rest", expr="calm", blade=0.0,
          jet_lvl=1.0, lift=0.0, wag=0.0, do_crown=False, do_trophy=False):
    hx, hy = 57 + lean * 0.5, 42 + bob
    fx, fy = 61 + lean * 0.5, 49 + bob
    bx, by = 58 + lean, 78 + bob * 0.6

    jet(d, bx - 3, by + 22, jet_lvl)
    htail(d, bx - 12, by + 5, wag)
    legs(d, bx, by, SIG, SIG_SH)

    poses = {
        "rest":  ((bx - 11, by - 3, bx - 12, by + 8), (bx + 11, by - 3, bx + 13, by + 8)),
        "steer": ((bx - 10, by - 2, bx - 12, by + 6), (bx + 11, by - 2, bx + 19, by + 2)),
        "up":    ((bx - 10, by - 6, bx - 17, by - 16), (bx + 10, by - 6, bx + 17, by - 16)),
        "hold":  ((bx - 10, by + 1, bx - 5, by + 8), (bx + 10, by + 1, bx + 5, by + 8)),
    }
    (ba, fa) = poses[arms]
    arm(d, ba[0], ba[1], ba[2], ba[3], SIG, SIG_SH)
    body(d, bx, by, SIG, SIG_HI, SIG_SH)
    arm(d, fa[0], fa[1], fa[2], fa[3], SIG, SIG_SH)

    helmet(d, hx, hy, RH, SIG, SIG_HI, SIG_SH)
    ears(d, hx, hy, RH, lift)        # behind pods so pods still read
    pods(d, hx, hy, RH)
    face(d, fx, fy, expr)
    snout(d, fx, fy)                 # snout overlays the kit mouth area
    brows(d, fx, fy)
    goggles(d, fx, fy)
    propeller(d, hx, hy - RH - 8, blade)
    if do_crown:
        crown(d, hx, hy - RH)
    if do_trophy:
        trophy_held(d, bx, by + 2)


# --- rows -------------------------------------------------------------------
def f_hover(i):
    t, d = blank()
    pilot(d, bob=cph(i) * 2, arms="rest", expr="calm", blade=i * 1.1,
          lift=cph(i) * 1.2, wag=cph(i) * 1.5, jet_lvl=0.8)
    return t


def f_move(i, hard=False):
    t, d = blank()
    pilot(d, lean=(5 if hard else 3), arms="steer",
          expr="strain" if hard else "determined", blade=i * 1.3,
          lift=2 + cph(i) * 2 if hard else 1 + cph(i),
          wag=1 + cph(i) * 2, jet_lvl=1.0)
    return t


def f_boost(i):
    t, d = blank()
    pilot(d, arms="steer", expr="joy", blade=i * 1.8, jet_lvl=1.6,
          lift=2.5 + cph(i) * 2, wag=cph(i) * 2.5)
    return t


def f_cheer(i):
    t, d = blank()
    pilot(d, bob=-(i % 2), arms="up", expr="joy", blade=i * 1.2,
          lift=cph(i) * 2, wag=cph(i) * 2.5, jet_lvl=0.9)
    return t


def f_combo(i):
    t, d = blank()
    pilot(d, arms="up", expr="star" if i >= 3 else "joy", blade=i * 1.5,
          jet_lvl=1.0 + i * 0.1, lift=1 + i * 0.3, wag=cph(i) * 2)
    return t


def f_dizzy():
    t, d = blank()
    pilot(d, arms="rest", expr="dizzy", blade=0.9, jet_lvl=0.3)
    from pilot_kit import GOLD
    for k in range(3):
        a = k / 3 * math.tau
        sx, sy = 57 + math.cos(a) * 19, 14 + math.sin(a) * 5
        line(d, sx - 2.5, sy, sx + 2.5, sy, 1.3, GOLD)
        line(d, sx, sy - 2.5, sx, sy + 2.5, 1.3, GOLD)
    return t


def f_sadcloud():
    t, d = blank()
    pilot(d, arms="rest", expr="sad", blade=0.5, jet_lvl=0.2)
    from pilot_kit import TEAL
    gy = 14
    for ox, r in ((-7, 6), (0, 7), (7, 6)):
        oval(d, 57 + ox, gy, r, r * 0.82, (150, 162, 184))
    oval(d, 57, gy - 2, 6, 5, (182, 196, 216))
    for k in range(4):
        rx = 49 + k * 5
        line(d, rx, gy + 7, rx - 1, gy + 13, 1.3, TEAL)
    return t


def f_trophy():
    t, d = blank()
    pilot(d, arms="hold", expr="joy", blade=1.0, jet_lvl=0.9, do_trophy=True)
    return t


def f_crown():
    t, d = blank()
    pilot(d, arms="up", expr="star", blade=1.0, jet_lvl=0.9, do_crown=True)
    return t


def f_starhead():
    t, d = blank()
    pilot(d, arms="up", expr="star", blade=1.2, jet_lvl=1.0, lift=1)
    return t


def f_sadhead():
    t, d = blank()
    pilot(d, arms="rest", expr="sad", blade=0.4, jet_lvl=0.2)
    return t


def build():
    rows = [
        [f_hover(i) for i in range(6)],
        [f_move(i, False) for i in range(6)],
        [f_move(i, True) for i in range(6)],
        [f_boost(i) for i in range(6)],
        [f_cheer(i) for i in range(6)],
        [f_combo(i) for i in range(6)],
        [f_dizzy(), f_sadcloud(), f_trophy(), f_crown(), f_starhead(), f_sadhead()],
    ]
    finish(rows, OUT, outline=OUTLINE)


if __name__ == "__main__":
    build()
