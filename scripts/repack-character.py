#!/usr/bin/env python3
"""
Repack the uploaded character sheet into the game's clean 6x8 / 120px grid.

The uploaded art (art-src/character/source-6x8.png, 896x1200) is 6 columns x 8
rows on a painted grey *checkerboard* background (NOT real alpha), with stray
text labels under the bottom two rows. The sprites are thin in places (legs,
propeller, jet flames), so any erode / median / hard-alpha step shreds them.
This pipeline is deliberately FAITHFUL — it removes the background and nothing
else:

  1. Treats the sheet as an exact, uniform 6x8 grid (cells 149.33 x 150) and
     maps the WHOLE cell onto its 120px output cell — the artist already aligned
     the poses, so we never re-centre or re-scale per frame (that is what made
     the old build jitter). Nothing is cropped.
  2. Removes the checkerboard by flood-filling inward from each cell edge, so
     enclosed mid-grey detail (the jet-pack) survives. Checker squares trapped
     inside the boost glow (which the flood can't reach) are cleared separately
     by detecting the real two-tone pattern, while leaving the jet-pack alone.
  3. Keeps only the character: the largest central blob plus nearby attached
     bits (propeller, flame, held trophy/crown). The bottom-row text labels and
     stray far sparkles are dropped.
  4. Builds clean SOFT alpha via a premultiplied LANCZOS downscale (no erosion,
     no median filter, no hard alpha cut) — thin legs and edges stay intact and
     the transparency reads cleanly against the busy game background.

Frame map (index = row*6 + col) — must match Constants.ts:
  row0 0-5   hover (front)            -> not steering (alive float)
  row1 6-11  side flight, calm        -> moving, low effort     (faces LEFT)
  row2 12-17 side flight, straining   -> moving held, high effort (faces LEFT)
  row3 18-23 boost + sparkles         -> golden score boost
  row4 24-29 cheer (arms up)          -> celebration
  row5 30-35 combo gestures x1..x20   -> numbered combo flash
  row6 36-41 dizzy, sad-cloud, trophy, crown, star-head, sad head
  row7 42-47 death: bonk -> spin -> fall

Usage: python repack-character.py [SOURCE.png]
"""
import sys
from collections import deque

import numpy as np
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "art-src/character/source-6x8.png"
OUT = "public/assets/character.png"

COLS, ROWS = 6, 8
CELL = 120             # output cell (rendered ~1:1 in game -> crisp)

# Keep/drop tuning. We keep the character's main blob plus any nearby attached
# bits (propeller, jet flame, held trophy/crown) and drop the bottom-row text
# labels and stray far sparkles. Each source cell is mapped faithfully onto its
# 120px output cell -- the artist already aligned the poses, so we do NOT re-
# centre or re-scale per frame (that is what used to make the animation jitter).
MIN_BLOB = 12          # ignore specks smaller than this (px)
MERGE_GAP = 14         # px: attach detached blobs this close to the body
LABEL_Y = 0.84         # drop *separate* blobs centred below this fraction of cell
CHECKER_MAX_AREA = 360  # grey islands up to this size are checker squares, not
#                         the jet-pack (one big solid blob) -> safe to drop


def checker_mask(rgb):
    """True where a pixel is the plain background: the grey checkerboard OR a flat
    white sheet (both low saturation). Enclosed white highlights survive because
    flood_bg only removes background connected to the cell edge."""
    a = rgb.astype(np.int16)
    sat = a.max(2) - a.min(2)
    val = a.mean(2)
    return (sat <= 26) & (val >= 45)


def flood_bg(checker):
    """Background = checkerboard pixels connected to the cell edge. Enclosed
    mid-grey detail (the jet-pack) is NOT reached, so it survives as body."""
    h, w = checker.shape
    bg = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if checker[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if checker[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not bg[ny, nx] and checker[ny, nx]:
                bg[ny, nx] = True
                q.append((nx, ny))
    return bg


def trapped_checker(rgb, bg):
    """Checker squares the edge flood-fill could NOT reach -- e.g. the ones
    trapped between the sparkles of the boost glow (where the semi-transparent
    gold tints them tan). Such a square is a small isolated grey/tan island,
    whereas the solid mid-grey jet-pack is one large blob (~900px+). So we match
    the muted grey/tan range, then drop only the SMALL islands and keep the big
    one -- and dark pixels (val<60: the jet-pack core, outlines) are never even
    considered, so they always survive."""
    a = rgb.astype(np.int16)
    sat = a.max(2) - a.min(2)
    val = a.mean(2)
    tone = (sat <= 40) & (val >= 60) & (val <= 190)
    cand = tone & ~bg
    lab, blobs = components(cand)
    out = np.zeros(cand.shape, bool)
    for b in blobs:
        if b["n"] <= CHECKER_MAX_AREA:  # small grey/tan island == a checker square
            out[lab == b["id"]] = True
    return out


def components(fg):
    """Label 4-connected foreground blobs. Returns (labels, list-of-bbox-info)."""
    h, w = fg.shape
    lab = np.zeros((h, w), np.int32)
    blobs = []
    nid = 0
    for sy in range(h):
        for sx in range(w):
            if not fg[sy, sx] or lab[sy, sx]:
                continue
            nid += 1
            q = deque([(sx, sy)])
            lab[sy, sx] = nid
            xs = [sx]
            ys = [sy]
            while q:
                x, y = q.popleft()
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and fg[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = nid
                        q.append((nx, ny))
                        xs.append(nx)
                        ys.append(ny)
            blobs.append({
                "id": nid, "n": len(xs),
                "x0": min(xs), "x1": max(xs), "y0": min(ys), "y1": max(ys),
                "cx": sum(xs) / len(xs), "cy": sum(ys) / len(ys),
            })
    return lab, blobs


def bbox_gap(a, b):
    """Closest gap between two axis-aligned bboxes (0 if they overlap/touch)."""
    dx = max(0, max(a["x0"] - b["x1"], b["x0"] - a["x1"]))
    dy = max(0, max(a["y0"] - b["y1"], b["y0"] - a["y1"]))
    return max(dx, dy)


def extract_keep(rgb):
    """Boolean keep-mask for the character in ONE source cell (HxWx3 uint8)."""
    checker = checker_mask(rgb)
    bg = flood_bg(checker)
    bg |= trapped_checker(rgb, bg)
    fg = ~bg
    lab, blobs = components(fg)
    if not blobs:
        return np.zeros(fg.shape, bool)

    h, w = fg.shape
    # Body = largest blob overlapping the central band (where the torso sits).
    cl, cr = 0.28 * w, 0.72 * w
    ct, cb = 0.10 * h, 0.66 * h
    central = [
        b for b in blobs
        if b["x1"] >= cl and b["x0"] <= cr and b["y1"] >= ct and b["y0"] <= cb
    ]
    body = max(central or blobs, key=lambda b: b["n"])

    # Keep the body + nearby attached bits (propeller / flame / held item).
    # Drop the bottom-row text labels and stray sparkles: a label is a separate
    # blob that lies ENTIRELY below the body (its top starts past the body's
    # feet), so it can never be a flame (overlaps the body) or a held item
    # (above / beside the body).
    keep_ids = {body["id"]}
    for b in blobs:
        if b["id"] in keep_ids or b["n"] < MIN_BLOB:
            continue
        if b["y0"] >= body["y1"] - 3:
            continue  # entirely below the body -> bottom-row label
        if b["cy"] >= LABEL_Y * h:
            continue  # belt-and-braces: anything centred in the bottom band
        if bbox_gap(b, body) <= MERGE_GAP:
            keep_ids.add(b["id"])

    return np.isin(lab, list(keep_ids))


def cell_rgba(rgb):
    """Clean RGBA for one cell: binary alpha, RGB zeroed off the keep mask so the
    later premultiplied downscale can't bleed grey/black into the edges."""
    keep = extract_keep(rgb)
    out = np.zeros((*keep.shape, 4), np.uint8)
    out[..., :3] = np.where(keep[..., None], rgb, 0)
    out[..., 3] = np.where(keep, 255, 0).astype(np.uint8)
    return out


def _bands(proj, thresh, merge_gap, min_span):
    """Group a 1-D projection into runs above `thresh`, merging runs separated by
    a gap <= merge_gap, then keep runs whose merged span >= min_span. Returns a
    list of (start, end) inclusive."""
    on = proj > thresh
    runs = []
    s = None
    for i, v in enumerate(on):
        if v and s is None:
            s = i
        elif not v and s is not None:
            runs.append([s, i - 1])
            s = None
    if s is not None:
        runs.append([s, len(on) - 1])
    # merge runs that are close together (propeller detached from body, etc.)
    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] <= merge_gap:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    return [(a, b) for a, b in merged if (b - a + 1) >= min_span]


def detect_centers(arr):
    """Find the real per-row / per-column character centres by projecting the
    saturated-colour mask. The source art has caption text bands ("HOVER/IDLE",
    "FLY"...) between rows that push the rows down irregularly, so a uniform
    H/ROWS grid mis-aligns and clips the legs. Text is low-saturation grey, so a
    saturation threshold isolates the coloured characters only."""
    a = arr.astype(np.int16)
    H, W, _ = a.shape
    sat = a.max(2) - a.min(2)
    colmask = sat > 55
    row_proj = colmask.sum(1)
    col_proj = colmask.sum(0)
    rows = _bands(row_proj, W * 0.02, merge_gap=20, min_span=40)
    cols = _bands(col_proj, H * 0.02, merge_gap=20, min_span=40)
    row_c = [(s + e) // 2 for s, e in rows]
    col_c = [(s + e) // 2 for s, e in cols]
    return row_c, col_c


def resize_rgba_premult(arr, size):
    """Premultiplied-alpha LANCZOS resize -> soft, clean edges with no dark
    fringe. arr: HxWx4 uint8. size: (w, h). Returns HxWx4 uint8."""
    a = arr[..., 3].astype(np.float32) / 255.0
    pm = arr[..., :3].astype(np.float32) * a[..., None]
    pm_img = Image.fromarray(pm.round().clip(0, 255).astype(np.uint8), "RGB").resize(
        size, Image.LANCZOS
    )
    a_img = Image.fromarray(arr[..., 3], "L").resize(size, Image.LANCZOS)
    pm_s = np.asarray(pm_img).astype(np.float32)
    a_s = np.asarray(a_img).astype(np.float32) / 255.0
    rgb = np.zeros_like(pm_s)
    nz = a_s > (1.0 / 255.0)
    rgb[nz] = pm_s[nz] / a_s[nz][..., None]
    rgb = rgb.clip(0, 255).round().astype(np.uint8)
    a8 = (a_s * 255.0).round().astype(np.uint8)
    a8[a_s < 0.02] = 0  # drop the faintest ghost halo
    return np.dstack([rgb, a8])


def main():
    im = Image.open(SRC).convert("RGB")
    arr = np.asarray(im)
    H, W, _ = arr.shape
    cw = W / COLS

    # Detect the REAL character centres per row/col. The source has caption text
    # bands between rows that shift them down irregularly, so a uniform H/ROWS
    # grid clips the legs and lets the row above bleed in.
    #
    # The game always ships a 6x8 (48-frame) grid so the skins + AnimationManager
    # stay stable, but the source art comes in two shapes:
    #   * 8-row sheet -> map straight through (row_map = identity).
    #   * 6-row sheet (HOVER, FLY, BOOST, CHEER, EMOTES, DEATH) -> there is no
    #     separate "diving" flight row nor a front-celebration row, so we DUPLICATE
    #     FLY into MOVE_HARD (out r2) and CHEER into the celebration row (out r5):
    #       out row: 0     1    2    3      4      5      6       7
    #       src row: HOVER FLY  FLY  BOOST  CHEER  CHEER  EMOTES  DEATH
    row_c, col_c = detect_centers(arr)
    if len(col_c) == COLS and len(row_c) == ROWS:
        row_map = list(range(ROWS))
    elif len(col_c) == COLS and len(row_c) == 6:
        row_map = [0, 1, 1, 2, 3, 3, 4, 5]
    else:
        print(f"WARN detect found {len(col_c)} cols / {len(row_c)} rows; "
              f"falling back to uniform 6x8 grid")
        col_c = [round(c * cw) + 75 for c in range(COLS)]
        row_c = [round(r * (H / ROWS)) + 49 for r in range(ROWS)]
        row_map = list(range(ROWS))
    print("col centres", col_c)
    print("row centres", row_c)
    print("row map (out<-src)", row_map)

    # 160px capture window scaled 0.75x into the 120px grid, centred on each
    # detected character so the propeller (top) and legs (bottom) both fit.
    BOX_SIZE = 160

    sheet = Image.new("RGBA", (COLS * CELL, ROWS * CELL), (0, 0, 0, 0))
    for r in range(ROWS):
        for c in range(COLS):
            cx = col_c[c]
            cy = row_c[row_map[r]]

            # extract with padding if out of bounds. Pad with checkerboard grey (78)
            # so the edge-flood-fill correctly removes the padding instead of 
            # treating it as a black foreground solid box.
            x0, x1 = cx - BOX_SIZE // 2, cx + BOX_SIZE // 2
            y0, y1 = cy - BOX_SIZE // 2, cy + BOX_SIZE // 2
            
            cell = np.full((BOX_SIZE, BOX_SIZE, 3), 78, dtype=arr.dtype)
            src_x0, src_y0 = max(0, x0), max(0, y0)
            src_x1, src_y1 = min(W, x1), min(H, y1)
            dst_x0, dst_y0 = src_x0 - x0, src_y0 - y0
            dst_x1, dst_y1 = dst_x0 + (src_x1 - src_x0), dst_y0 + (src_y1 - src_y0)
            
            cell[dst_y0:dst_y1, dst_x0:dst_x1] = arr[src_y0:src_y1, src_x0:src_x1]

            rgba = cell_rgba(cell)
            small = resize_rgba_premult(rgba, (CELL, CELL))
            sheet.paste(Image.fromarray(small, "RGBA"), (c * CELL, r * CELL))

    sheet.save(OUT)
    print(f"wrote {OUT} {sheet.size} (6x8, cell {CELL}x{CELL}, {COLS * ROWS} frames)")


if __name__ == "__main__":
    main()
