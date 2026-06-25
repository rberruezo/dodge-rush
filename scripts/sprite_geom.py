#!/usr/bin/env python3
"""
Per-cell geometry helpers for Tier-1 skin "shape signatures" — small silhouette
edits that make a recolour read as a distinct character (not "the paler cat").
Everything is anchored off each cell's own content (bbox / opaque runs), so it
works across all 42 frames without per-frame coordinates.
"""
from PIL import Image, ImageDraw


def _runs(px, y, W):
    runs, x = [], 0
    while x < W:
        if px[x, y][3] > 40:
            xs = x
            while x < W and px[x, y][3] > 40:
                x += 1
            runs.append((xs, x - 1))
        else:
            x += 1
    return runs


def head_anchor(cell, frac=0.45):
    """(cx, half, top_y, bottom_y) of the widest blob in the top `frac` of the
    content — i.e. the helmet/head, ignoring the thin propeller above it."""
    bbox = cell.getbbox()
    if not bbox:
        return None
    x0, y0, x1, y1 = bbox
    H = y1 - y0
    W = cell.size[0]
    px = cell.load()
    yend = y0 + max(6, int(H * frac))
    maxw, cx = 0, 0
    for y in range(y0, yend):
        for a, b in _runs(px, y, W):
            if b - a > maxw:
                maxw, cx = b - a, (a + b) / 2
    if maxw < 6:
        return None
    top_y = y0
    for y in range(y0, yend):
        rs = _runs(px, y, W)
        if rs and max(b - a for a, b in rs) >= 0.5 * maxw:
            top_y = y
            break
    return cx, maxw / 2, top_y, y1


def map_cells(sheet, fn, cols=6, rows=7, cell=120):
    out = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    for ry in range(rows):
        for cx in range(cols):
            box = (cx * cell, ry * cell, cx * cell + cell, ry * cell + cell)
            c = sheet.crop(box).convert("RGBA")
            c = fn(c) or c
            out.paste(c, (cx * cell, ry * cell))
    return out


# --- shape signatures -------------------------------------------------------
def add_horns(cell, base=(46, 22, 42), tip=(228, 40, 36)):
    """Two little devil horns on the helmet (NEMESIS)."""
    a = head_anchor(cell)
    if not a:
        return cell
    cx, half, top_y, _ = a
    d = ImageDraw.Draw(cell)
    for s in (-1, 1):
        bx = cx + s * half * 0.58
        d.polygon([(bx - 3, top_y + 4), (bx + 3, top_y + 4), (bx + s * 5, top_y - 7)],
                  fill=(*base, 255))
        d.polygon([(bx, top_y + 1), (bx + s * 4, top_y - 6), (bx + s * 1.5, top_y + 1)],
                  fill=(*tip, 255))
    return cell


def add_icicles(cell, col=(196, 236, 255), tip=(255, 255, 255), edge=(120, 170, 210)):
    """Ice spikes hanging from the lower silhouette (FROST)."""
    bbox = cell.getbbox()
    if not bbox:
        return cell
    x0, y0, x1, y1 = bbox
    W = cell.size[0]
    px = cell.load()
    d = ImageDraw.Draw(cell)
    step = max(4, (x1 - x0) // 7)
    for x in range(x0 + 3, x1 - 2, step):
        ly = None
        for y in range(y1, y0, -1):
            if px[x, y][3] > 70:
                ly = y
                break
        if ly is None or ly < y0 + (y1 - y0) * 0.45:
            continue
        h = 4 + (x * 7 % 4)
        d.polygon([(x - 2, ly - 1), (x + 2, ly - 1), (x, ly + h)], fill=(*edge, 255))
        d.polygon([(x - 1, ly - 1), (x + 1, ly - 1), (x, ly + h - 1)], fill=(*col, 255))
        d.point((x, ly + h), fill=(*tip, 255))
    return cell


def add_cape(cell, col=(182, 34, 50), sh=(122, 18, 34), trim=(255, 208, 84)):
    """A royal cape behind the body with a wavy hem (GOLD KING)."""
    import math
    a = head_anchor(cell)
    if not a:
        return cell
    cx, half, top_y, y1 = a
    sy = top_y + half * 0.85
    by = y1 + 1
    wt, wb = half * 0.62, half * 1.18       # narrower than before
    layer = Image.new("RGBA", cell.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    def cape(width_top, width_bot, fill):
        pts = [(cx - width_top, sy)]
        # wavy hem (3 lobes) left->right
        lobes, span = 3, 2 * width_bot
        for i in range(lobes):
            lx = cx - width_bot + i * (span / lobes)
            for t in (0.25, 0.5, 0.75, 1.0):
                xx = lx + t * (span / lobes)
                pts.append((xx, by + 5 * math.sin(math.pi * t)))
        pts.append((cx + width_top, sy))
        d.polygon([(round(px), round(py)) for px, py in pts], fill=(*fill, 255))

    cape(wt + 1, wb + 1, sh)                 # shadow underlay
    cape(wt, wb, col)
    d.line([(cx - wt, sy + 1), (cx + wt, sy + 1)], fill=(*trim, 255), width=2)
    layer.alpha_composite(cell)
    return layer
