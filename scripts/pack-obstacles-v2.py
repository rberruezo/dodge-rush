#!/usr/bin/env python3
"""pack-obstacles-v2.py — Pack the new long-panel obstacle sprites.

New approach: each obstacle type is a single long WALL panel (no tiling needed)
and a separate PILLAR panel (for fork obstacles with 2 gaps).  At runtime the
engine uses Image + setCrop to show only the required portion of the wall without
ever repeating the texture.

Source: art-src/obstacles/new-way-obstacles.png (1024×1536, 8-row sprite sheet)
Output: public/assets/obstacles.png
"""

import os
import sys
import numpy as np
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
SRC  = os.path.join(BASE, '../art-src/obstacles/new-way-obstacles.png')
OUT  = os.path.join(BASE, '../public/assets/obstacles.png')

PAD = 4  # px gap between sprites in the atlas

# --- source sprite coordinates (measured from the 1024×1536 sheet) ------
NAMES = [
    'blue_bar', 'green_bar', 'purple_pillar',
    'red_arrow', 'red_spike',
    'stone_crack', 'blue_tile', 'gold_block',
]

SRC_ROWS = [          # (y0, y1) inclusive
    (69,  189),       # blue_bar
    (250, 365),       # green_bar
    (427, 543),       # purple_pillar
    (604, 718),       # red_arrow
    (779, 894),       # red_spike
    (955, 1036),      # stone_crack
    (1099, 1217),     # blue_tile
    (1276, 1394),     # gold_block
]

SRC_WALL_X    = (43,  706)   # x0, x1 inclusive → 664 px wide
SRC_PILLAR_X  = (746, 852)   # x0, x1 inclusive → 107 px wide (primary fork pillar)
SRC_PILLAR2_X = (884, 985)   # x0, x1 inclusive → 102 px wide (secondary variant)


# -------------------------------------------------------------------------

def harden(arr: np.ndarray) -> np.ndarray:
    """Binary alpha (≥128 → 255, else 0); zero out RGB under transparent px."""
    out = arr.copy()
    mask = out[:, :, 3] >= 128
    out[:, :, 3] = np.where(mask, 255, 0)
    out[~mask] = 0
    return out


def extract(arr: np.ndarray, x0: int, x1: int, y0: int, y1: int) -> np.ndarray:
    return harden(arr[y0:y1 + 1, x0:x1 + 1].copy())


def main() -> None:
    src = Image.open(SRC).convert('RGBA')
    arr = np.array(src)

    wall_w    = SRC_WALL_X[1]    - SRC_WALL_X[0]    + 1   # 664
    pillar_w  = SRC_PILLAR_X[1]  - SRC_PILLAR_X[0]  + 1   # 107
    pillar2_w = SRC_PILLAR2_X[1] - SRC_PILLAR2_X[0] + 1   # 102

    # --- atlas dimensions ---------------------------------------------------
    AW = PAD + wall_w + PAD + pillar_w + PAD + pillar2_w + PAD
    AH = PAD + sum(y1 - y0 + 1 for y0, y1 in SRC_ROWS) + len(SRC_ROWS) * PAD

    atlas = np.zeros((AH, AW, 4), np.uint8)

    pillar_col  = PAD + wall_w + PAD
    pillar2_col = pillar_col + pillar_w + PAD

    frames: dict = {}   # name → (wallX,wallY,wallW,wallH, px,py,pw,ph, p2x,p2y,p2w,p2h)
    cy = PAD

    for name, (y0, y1) in zip(NAMES, SRC_ROWS):
        h = y1 - y0 + 1
        wall    = extract(arr, SRC_WALL_X[0],    SRC_WALL_X[1],    y0, y1)
        pillar  = extract(arr, SRC_PILLAR_X[0],  SRC_PILLAR_X[1],  y0, y1)
        pillar2 = extract(arr, SRC_PILLAR2_X[0], SRC_PILLAR2_X[1], y0, y1)

        atlas[cy:cy + h, PAD:PAD + wall_w]                   = wall
        atlas[cy:cy + h, pillar_col:pillar_col + pillar_w]   = pillar
        atlas[cy:cy + h, pillar2_col:pillar2_col + pillar2_w] = pillar2

        frames[name] = (PAD, cy, wall_w, h,
                        pillar_col, cy, pillar_w, h,
                        pillar2_col, cy, pillar2_w, h)
        cy += h + PAD

    Image.fromarray(atlas).save(OUT)
    actual_h = cy  # last row end + already added PAD above
    print(f'wrote {OUT} ({AW}x{AH}), {len(NAMES)} types')

    # --- TypeScript output --------------------------------------------------
    print()
    print('// ---- paste into src/config/Constants.ts ----')
    print()
    print('export interface ObstacleWallFrameDef {')
    print('  name: string;')
    print('  wallX: number; wallY: number; wallW: number; wallH: number;')
    print('  pillarX: number; pillarY: number; pillarW: number; pillarH: number;')
    print('}')
    print()
    print('export const OBSTACLE_WALL_FRAMES: ObstacleWallFrameDef[] = [')
    for name, (wx, wy, ww, wh, px, py, pw, ph, p2x, p2y, p2w, p2h) in frames.items():
        print(f"  {{ name: '{name}',"
              f" wallX: {wx}, wallY: {wy}, wallW: {ww}, wallH: {wh},"
              f" pillarX: {px}, pillarY: {py}, pillarW: {pw}, pillarH: {ph} }},")
    print('];')


if __name__ == '__main__':
    main()
