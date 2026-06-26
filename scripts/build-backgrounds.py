#!/usr/bin/env python3
"""
Build the interchangeable "night" background tiles for the infinite descent.

The descent is rendered as an endless vertical stack of full-screen tiles (see
src/objects/Background.ts). Each source tile is hand-drawn so its left/right
building columns line up with every other tile's, which means the tiles can be
shuffled into ANY order and still flow seamlessly — selling an eternal fall with
no fixed loop point.

Each source is simply downscaled to the game's resolution (one tile == one
screen). No mirroring is needed: continuity comes from the edge-matched art, not
from reflection.

Usage: python3 scripts/build-backgrounds.py
"""
from PIL import Image

W, H = 540, 960  # game resolution; each tile spans exactly one screen

# Night-theme tiles. Order here is irrelevant at runtime — the engine shuffles
# them — it only sets the bg_night_<i>.png filenames.
SOURCES = [
    ("/Users/rama/Downloads/bg-image-night-tile-A.png", "public/assets/bg_night_0.png"),
    ("/Users/rama/Downloads/bg-image-night-tile-B.png", "public/assets/bg_night_1.png"),
    ("/Users/rama/Downloads/bg-image-night-tile-C.png", "public/assets/bg_night_2.png"),
    ("/Users/rama/Downloads/bg-image-night-tile-D.png", "public/assets/bg_night_3.png"),
]


def main() -> None:
    for src, out in SOURCES:
        im = Image.open(src).convert("RGB").resize((W, H), Image.LANCZOS)
        im.save(out)
        print(f"wrote {out} {im.size}")


if __name__ == "__main__":
    main()
