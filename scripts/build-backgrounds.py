#!/usr/bin/env python3
"""
Build seamless, vertically-loopable background textures for the infinite descent.

The source skies are NOT vertically tileable (bright sun at the bottom, dark sky
at the top). To loop them forever without a visible seam, each image is downscaled
to the game's resolution and stacked with its own vertical mirror:

    [ image ] [ flip(image) ]      ->  540 x 1920

Tiling this vertically is perfectly seamless: every wrap/junction is a mirror
reflection (sun-meets-sun, sky-meets-sky), which reads naturally against the
dreamy clouds. A TileSprite then scrolls it for an endless fall.

Usage: python3 scripts/build-backgrounds.py
"""
from PIL import Image

W, H = 540, 960  # game resolution

# day-cycle order: sunset -> twilight -> night
SOURCES = [
    ("/Users/rama/Downloads/ChatGPT Image 24 jun 2026, 07_42_04 p.m..png", "public/assets/background_0.png"),
    ("/Users/rama/Downloads/ChatGPT Image 24 jun 2026, 07_39_22 p.m..png", "public/assets/background_1.png"),
    ("/Users/rama/Downloads/ChatGPT Image 24 jun 2026, 07_39_15 p.m..png", "public/assets/background_2.png"),
]


def main() -> None:
    for src, out in SOURCES:
        im = Image.open(src).convert("RGB").resize((W, H), Image.LANCZOS)
        flipped = im.transpose(Image.FLIP_TOP_BOTTOM)
        doubled = Image.new("RGB", (W, H * 2))
        doubled.paste(im, (0, 0))
        doubled.paste(flipped, (0, H))
        doubled.save(out)
        print(f"wrote {out} {doubled.size}")


if __name__ == "__main__":
    main()
