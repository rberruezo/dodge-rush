#!/usr/bin/env python3
"""
DRAGONCITO — a propeller-PILOT baby dragon, replacing SOPLO. Wears the shared
kit from pilot_kit.py so it reads as the same universe as character / cat /
unicorn / phoenix. Dragon-flavoured variation: little horns + a spiky crest on
the helmet, a scaly tail, and a forward FIRE-BREATH on boost. Trophy/crown
frames show the character itself.

Output: public/assets/character_dragon.png — 6x7 / 120px, drop-in.
"""
import math
import pilot_kit as K
from pilot_kit import (blank, finish, jet, helmet, pods, propeller, face,
                       goggles, body, arm, legs, crown, trophy_held,
                       flame_up, flame_dir, oval, poly, line)

OUT = "public/assets/character_dragon.png"

# signature palette (friendly green)
SIG    = (120, 200, 92)
SIG_HI = (178, 230, 132)
SIG_SH = (74, 150, 70)
OUTLINE = (40, 44, 30)
HORN    = (246, 234, 204)
HORN_SH = (206, 186, 150)
SPIKE   = (88, 170, 88)

RH = 22


def cph(i, n=6):
    return math.sin(i / n * math.tau)


def dtail(d, x, y, spread=1.0, flick=0.0):
    """Scaly tail curling down-back (down-left) with a spade tip."""
    seg = [(x, y), (x - 6, y + 5 * spread), (x - 9, y + 11 * spread),
           (x - 8 + flick, y + 16 * spread)]
    radii = [5.2, 4.2, 3.2, 2.3]
    for (px, py), r in zip(seg, radii):
        oval(d, px, py, r + 0.5, r + 0.5, SIG_SH)
        oval(d, px, py, r, r, SIG)
    tx, ty = seg[-1]
    poly(d, [(tx - 5, ty + 1), (tx, ty - 3), (tx + 4, ty + 2),
             (tx, ty + 6)], SPIKE)        # spade fin
    poly(d, [(tx - 4, ty + 1), (tx, ty - 1), (tx + 2, ty + 2)], SIG_HI)


def horns(d, hx, hy):
    top = hy - RH
    for s in (-1, 1):
        bx = hx + s * 8
        poly(d, [(bx - 2.4, top + 5), (bx + 2.4, top + 5),
                 (bx + s * 4.5, top - 6)], HORN_SH)
        poly(d, [(bx - 1.6, top + 4.5), (bx + 1.6, top + 4.5),
                 (bx + s * 3.6, top - 5)], HORN)


def crest_spikes(d, hx, hy):
    top = hy - RH + 1
    for off in (-7, -2.5, 2.5, 7):
        h = 6 - abs(off) * 0.25
        poly(d, [(hx + off - 2.4, top + 3), (hx + off + 2.4, top + 3),
                 (hx + off, top + 3 - h)], SPIKE)
        poly(d, [(hx + off - 1.2, top + 3), (hx + off + 1.2, top + 3),
                 (hx + off, top + 3 - h * 0.6)], SIG_HI)


def fire_breath(d, fx, fy, level=1.0):
    """Flame breathed forward (right) from the mouth — boost signature."""
    for k in range(3):
        flame_dir(d, fx + 12 + k * 6, fy + 5 + k * 1.5, math.radians(2),
                  6 * level - k, 16 * level - k * 3)


def pilot(d, bob=0.0, lean=0.0, arms="rest", expr="calm", blade=0.0,
          jet_lvl=1.0, flick=0.0, tail_spread=1.0, do_crown=False,
          do_trophy=False, breath=0.0):
    hx, hy = 57 + lean * 0.5, 42 + bob
    fx, fy = 61 + lean * 0.5, 49 + bob
    bx, by = 58 + lean, 78 + bob * 0.6

    jet(d, bx - 3, by + 22, jet_lvl)
    dtail(d, bx - 12, by + 4, tail_spread, flick)
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
    crest_spikes(d, hx, hy)
    horns(d, hx, hy)
    pods(d, hx, hy, RH)
    face(d, fx, fy, expr)
    goggles(d, fx, fy)
    if breath > 0:
        fire_breath(d, fx, fy, breath)
    propeller(d, hx, hy - RH - 8, blade)
    if do_crown:
        crown(d, hx, hy - RH)
    if do_trophy:
        trophy_held(d, bx, by + 2)


def f_hover(i):
    t, d = blank()
    pilot(d, bob=cph(i) * 2, arms="rest", expr="calm", blade=i * 1.1,
          flick=cph(i) * 1.5, jet_lvl=0.8)
    return t


def f_move(i, hard=False):
    t, d = blank()
    pilot(d, lean=(5 if hard else 3), arms="steer",
          expr="strain" if hard else "determined", blade=i * 1.3,
          flick=2 + cph(i) * 2 if hard else 1 + cph(i), jet_lvl=1.0,
          tail_spread=1.15 if hard else 1.0)
    return t


def f_boost(i):
    t, d = blank()
    pilot(d, arms="steer", expr="joy", blade=i * 1.8, jet_lvl=1.6,
          flick=cph(i) * 2, tail_spread=1.2, breath=1.1 + 0.15 * (i % 3))
    return t


def f_cheer(i):
    t, d = blank()
    pilot(d, bob=-(i % 2), arms="up", expr="joy", blade=i * 1.2,
          flick=cph(i) * 2, jet_lvl=0.9)
    return t


def f_combo(i):
    t, d = blank()
    pilot(d, arms="up", expr="star" if i >= 3 else "joy", blade=i * 1.5,
          jet_lvl=1.0 + i * 0.1, breath=0.0 if i < 2 else 0.9,
          tail_spread=1.0 + i * 0.04)
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


def build():
    rows = [
        [f_hover(i) for i in range(6)],
        [f_move(i, False) for i in range(6)],
        [f_move(i, True) for i in range(6)],
        [f_boost(i) for i in range(6)],
        [f_cheer(i) for i in range(6)],
        [f_combo(i) for i in range(6)],
        [f_dizzy(), f_sadcloud(), f_trophy(), f_crown(), _star(), _sad()],
    ]
    finish(rows, OUT, outline=OUTLINE)


def _star():
    t, d = blank()
    pilot(d, arms="up", expr="star", blade=1.2, jet_lvl=1.0, flick=1)
    return t


def _sad():
    t, d = blank()
    pilot(d, arms="rest", expr="sad", blade=0.4, jet_lvl=0.2)
    return t


if __name__ == "__main__":
    build()
