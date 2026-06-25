#!/usr/bin/env python3
"""
POLLITO FENIX — re-done as a propeller-PILOT so it lives in the same universe as
character / cat / unicorn. Wears the shared kit from pilot_kit.py (propeller +
aviator hood + side pods + goggles + padded teal-trim suit + rocket boots) with
phoenix-flavoured variation: a flame crest poking from the helmet, a flame tail,
and a fire corona on boost. Trophy/crown frames show the character itself.

Output: public/assets/character_phoenix.png — 6x7 / 120px, drop-in.
"""
import math
import pilot_kit as K
from pilot_kit import (blank, finish, jet, helmet, pods, propeller, face,
                       goggles, body, arm, legs, crown, trophy_held,
                       flame_up, flame_dir, oval, FL_Y, FL_O, FL_R)

OUT = "public/assets/character_phoenix.png"

# signature palette (fiery orange suit/helmet)
SIG    = (244, 120, 48)
SIG_HI = (255, 180, 98)
SIG_SH = (196, 72, 28)
OUTLINE = (52, 28, 22)

# anchors (facing right)
RH = 22


def cph(i, n=6):
    return math.sin(i / n * math.tau)


def tail(d, x, y, spread=1.0, flick=0.0):
    for k, ang in enumerate((206, 224, 242)):
        a = math.radians(ang)
        flame_dir(d, x + math.cos(a) * 5, y + math.sin(a) * 5,
                  a + flick * 0.08 * (k - 1), 9 * spread, 17 * spread)


def crest(d, hx, hy, flick=0.0):
    top = hy - RH + 3
    flame_up(d, hx - 6, top + 2, 6, 11, sway=-1 + flick)
    flame_up(d, hx, top, 8, 16, sway=flick)
    flame_up(d, hx + 6, top + 2, 6, 10, sway=1 + flick)


def pilot(d, bob=0.0, lean=0.0, arms="rest", expr="calm", blade=0.0,
          jet_lvl=1.0, flick=0.0, tail_spread=1.0, do_crown=False,
          do_trophy=False, aura=0.0):
    hx, hy = 57 + lean * 0.5, 42 + bob
    fx, fy = 61 + lean * 0.5, 49 + bob
    bx, by = 58 + lean, 78 + bob * 0.6

    if aura > 0:
        n = 9
        for k in range(n):
            ang = k / n * math.tau + aura
            flame_dir(d, bx + math.cos(ang) * 26, (by - 6) + math.sin(ang) * 30,
                      ang, 8 + 2 * (k % 2), 16 + 3 * (k % 3))

    jet(d, bx - 3, by + 22, jet_lvl)
    tail(d, bx - 13, by + 3, tail_spread, flick)
    legs(d, bx, by, SIG, SIG_SH)

    # arm endpoints per pose (back arm, front arm)
    poses = {
        "rest":  ((bx - 11, by - 3, bx - 12, by + 8), (bx + 11, by - 3, bx + 13, by + 8)),
        "steer": ((bx - 10, by - 2, bx - 12, by + 6), (bx + 11, by - 2, bx + 19, by + 2)),
        "up":    ((bx - 10, by - 6, bx - 17, by - 16), (bx + 10, by - 6, bx + 17, by - 16)),
        "hold":  ((bx - 10, by + 1, bx - 5, by + 8), (bx + 10, by + 1, bx + 5, by + 8)),
    }
    (ba, fa) = poses[arms]
    arm(d, ba[0], ba[1], ba[2], ba[3], SIG, SIG_SH)      # back arm
    body(d, bx, by, SIG, SIG_HI, SIG_SH)
    arm(d, fa[0], fa[1], fa[2], fa[3], SIG, SIG_SH)      # front arm

    # head group
    helmet(d, hx, hy, RH, SIG, SIG_HI, SIG_SH)
    crest(d, hx, hy, flick)
    pods(d, hx, hy, RH)
    face(d, fx, fy, expr)
    goggles(d, fx, fy)
    propeller(d, hx, hy - RH - 8, blade)
    if do_crown:                                         # on top, fully visible
        crown(d, hx, hy - RH)
    if do_trophy:                                        # in front of chest, on top
        trophy_held(d, bx, by + 2)


# --- rows -------------------------------------------------------------------
def f_hover(i):
    t, d = blank()
    pilot(d, bob=cph(i) * 2, arms="rest", expr="calm", blade=i * 1.1,
          flick=cph(i) * 1.2, jet_lvl=0.8)
    return t


def f_move(i, hard=False):
    t, d = blank()
    pilot(d, lean=(5 if hard else 3), arms="steer",
          expr="strain" if hard else "determined", blade=i * 1.3,
          flick=2 + cph(i) * 2 if hard else 1 + cph(i), jet_lvl=1.0,
          tail_spread=1.2 if hard else 1.0)
    return t


def f_boost(i):
    t, d = blank()
    pilot(d, arms="up", expr="joy", blade=i * 1.8, jet_lvl=1.6,
          flick=cph(i) * 2, tail_spread=1.3, aura=i * 0.2)
    return t


def f_cheer(i):
    t, d = blank()
    pilot(d, bob=-(i % 2), arms="up", expr="joy", blade=i * 1.2,
          flick=cph(i) * 2, jet_lvl=0.9)
    return t


def f_combo(i):
    t, d = blank()
    pilot(d, arms="up", expr="star" if i >= 3 else "joy", blade=i * 1.5,
          jet_lvl=1.0 + i * 0.1, aura=0.0 if i < 1 else i * 0.3,
          tail_spread=1.0 + i * 0.05)
    return t


def f_dizzy():
    t, d = blank()
    pilot(d, arms="rest", expr="dizzy", blade=0.9, jet_lvl=0.3, flick=0)
    # a few stunned sparkle-stars circling the head
    from pilot_kit import GOLD, line as kline
    for k in range(3):
        a = k / 3 * math.tau
        sx, sy = 57 + math.cos(a) * 19, 15 + math.sin(a) * 5
        kline(d, sx - 2.5, sy, sx + 2.5, sy, 1.3, GOLD)
        kline(d, sx, sy - 2.5, sx, sy + 2.5, 1.3, GOLD)
    return t


def f_sadcloud():
    t, d = blank()
    pilot(d, arms="rest", expr="sad", blade=0.5, jet_lvl=0.2)
    gy = 14
    for ox, r in ((-7, 6), (0, 7), (7, 6)):
        oval(d, 57 + ox, gy, r, r * 0.82, (150, 162, 184))
    oval(d, 57, gy - 2, 6, 5, (182, 196, 216))
    from pilot_kit import TEAL, line as kline
    for k in range(4):
        rx = 49 + k * 5
        kline(d, rx, gy + 7, rx - 1, gy + 13, 1.3, TEAL)
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
    pilot(d, arms="up", expr="star", blade=1.2, jet_lvl=1.0, flick=1)
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
