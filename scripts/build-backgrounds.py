#!/usr/bin/env python3
"""
Build the "Sky City" infinite-background assets for the aerial descent.

Source art (art-src/skycity/, vendored from the resources pack) is authored at
720px wide. We downscale every layer to the game's logical width (540px) — this
keeps each looping tile non-power-of-two but that is fine: Background.ts stacks
plain Images by hand instead of using Phaser TileSprites, so NPOT wrapping is a
non-issue, and it roughly halves texture memory on device.

Layers (see art-src/skycity/README-source.md + docs/background-skycity.md):
  - sky_<zone>      720x1280 -> 512x1024 fixed skybox per zone (POT; stretched
                    to fill, so power-of-two uploads reliably on weak WebView GL)
  - clouds[_far]    720x900  -> 540x675  loopable parallax cloud tiles
  - airships[_lights] 720x2400 -> 540x1800  tall tile = occasional airships
  - spaceship[_lights] 720x6400 -> 540x4800  very tall tile = rare cruiser

Heights stay proportional, so the "frequency" (tile height) relationship that
controls how often each vehicle appears is preserved.

Usage: python3 scripts/build-backgrounds.py
"""
import os
from PIL import Image

W = 540  # game logical width; every layer is downscaled to this and drawn 1:1
# Full-screen skies are stretched to fill, so we force power-of-two dims: NPOT
# (540x960) sky PNGs decoded but never uploaded on some Android WebView GL
# drivers (BG-005). 512x1024 uploads reliably; tile layers keep W=540 for loop math.
SKY_POT = (512, 1024)

SRC = os.path.join(os.path.dirname(__file__), "..", "art-src", "skycity")
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "assets")

# (source filename, output key) — output is public/assets/<key>.png
LAYERS = [
    ("sky_day.png", "bg_sky_day"),
    ("sky_dusk.png", "bg_sky_dusk"),
    ("sky_sunset.png", "bg_sky_sunset"),
    ("sky_twilight.png", "bg_sky_twilight"),
    ("sky_night.png", "bg_sky_night"),
    ("sky_aurora.png", "bg_sky_aurora"),
    ("clouds_far.png", "bg_clouds_far"),
    ("clouds.png", "bg_clouds"),
    ("airships.png", "bg_airships"),
    ("airships_lights.png", "bg_airships_lights"),
    ("spaceship.png", "bg_spaceship"),
    ("spaceship_lights.png", "bg_spaceship_lights"),
]


def main() -> None:
    for src_name, key in LAYERS:
        src = os.path.join(SRC, src_name)
        im = Image.open(src).convert("RGBA")
        if key.startswith("bg_sky_"):
            im = im.resize(SKY_POT, Image.LANCZOS)  # POT, stretched to fill
        else:
            w, h = im.size
            out_h = round(h * (W / w))  # keep aspect -> preserves loop tile height
            im = im.resize((W, out_h), Image.LANCZOS)
        out = os.path.join(OUT, key + ".png")
        im.save(out)
        print(f"wrote {out} {im.size}")


if __name__ == "__main__":
    main()
