#!/usr/bin/env python3
"""
Build a clean, pixel-art obstacle atlas from the raw obstacle pack.

Crops each obstacle by its detected bounding box, downscales + quantises to a
limited palette with hard alpha edges (matching the character art style), and
packs them tightly into a single-row atlas. Prints the frame rectangles and each
obstacle's dominant colour (used as the solid "wall fill" behind the tiled texture
so the barriers never look see-through).

Source resolution guide:
  1024×1024 source → DOWNSCALE=4.0 → ~40-55px tiles (current baseline)
  2048×2048 source → DOWNSCALE=2.0 → ~80-110px tiles (recommended for future art)
  Higher-res tiles survive the 88px bandHeight scaling without upscaling blur and
  give animators more pixel budget for detail. BOXES coords must be re-mapped when
  switching sources.

After regenerating the atlas, always re-run gen-anim-frames.py to rebuild row 1
(animation frames), then sync the PNG to dist/ and mobile/web/assets/.

Usage: python3 scripts/build-obstacles.py [/path/to/raw_obstacles.png]
"""
import sys
from collections import Counter
from PIL import Image

DEFAULT_SRC = "/Users/rama/Downloads/ChatGPT Image 24 jun 2026, 09_17_51 a.m..png"
OUT = "public/assets/obstacles.png"

# name -> (x, y, w, h) tight bbox in the 1024x1024 source (arrow uses left piece)
# NOTE: if the source is upgraded to 2048×2048, multiply all coords by 2 and set
# DOWNSCALE = 2.0 for higher-fidelity output tiles.
BOXES = [
    ("blue_bar", (86, 76, 211, 110)),
    ("green_bar", (364, 72, 312, 119)),
    ("purple_pillar", (790, 49, 100, 167)),
    ("red_arrow", (623, 293, 158, 132)),
    ("red_spike", (86, 517, 237, 166)),
    ("stone_crack", (375, 525, 270, 138)),
    ("blue_tile", (708, 525, 228, 137)),
    ("gold_block", (393, 734, 234, 155)),
]

# Set to 2.0 when using a 2048×2048 source for higher-resolution output tiles.
DOWNSCALE = 4.0
PALETTE_COLORS = 64
ALPHA_CUT = 110
GAP = 2  # transparent separator between packed tiles


def tighten(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def dominant(img: Image.Image) -> str:
    px = img.load()
    w, h = img.size
    counts = Counter()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 200:
                counts[(r // 16, g // 16, b // 16)] += 1
    if not counts:
        return "0x000000"
    r, g, b = counts.most_common(1)[0][0]
    return f"0x{r*16:02x}{g*16:02x}{b*16:02x}"


def main() -> None:
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
    im = Image.open(src).convert("RGBA")

    tiles = []
    for name, (x, y, w, h) in BOXES:
        crop = im.crop((x, y, x + w, y + h))
        small = crop.resize((round(w / DOWNSCALE), round(h / DOWNSCALE)), Image.LANCZOS)
        # harden alpha for crisp pixel edges
        r, g, b, a = small.split()
        a = a.point(lambda v: 255 if v >= ALPHA_CUT else 0)
        tile = tighten(Image.merge("RGBA", (r, g, b, a)))
        tiles.append((name, tile))

    atlas_w = sum(t.width for _, t in tiles) + GAP * (len(tiles) - 1)
    atlas_h = max(t.height for _, t in tiles)
    atlas = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))

    rects = []
    cx = 0
    for name, tile in tiles:
        atlas.paste(tile, (cx, 0))
        rects.append((name, cx, 0, tile.width, tile.height))
        cx += tile.width + GAP

    # Global palette quantise (consistent, retro look) preserving hard alpha.
    r, g, b, a = atlas.split()
    rgb = Image.merge("RGB", (r, g, b))
    pal = rgb.quantize(colors=PALETTE_COLORS, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
    pr, pg, pb = pal.split()
    final = Image.merge("RGBA", (pr, pg, pb, a))
    final.save(OUT)

    print(f"wrote {OUT} {final.size}")
    print("frames + dominant colour:")
    for (name, x, y, w, h), (_, tile) in zip(rects, tiles):
        print(f"  {name:14s} rect=({x},{y},{w},{h}) fill={dominant(tile)}")


if __name__ == "__main__":
    main()
