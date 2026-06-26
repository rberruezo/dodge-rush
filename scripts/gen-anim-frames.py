#!/usr/bin/env python3
"""
Append animation frame 1 for red_arrow and red_spike to the obstacle atlas.

Row 0 (y=0..49): original 8 tiles — untouched.
Row 1 (y=50..91): frame 1 for animated tiles at their same x positions.

  red_arrow_f1  (x=255, y=50, 40x33): sprite shifted 2px right → judder hints motion
  red_spike_f1  (x=297, y=50, 59x42): sprite shifted 2px up   → spikes "lunge"

Usage: python3 scripts/gen-anim-frames.py
"""
from PIL import Image

ATLAS = "public/assets/obstacles.png"
ROW1_Y = 50   # start of the animation row
ROW1_H = 42   # max height needed (red_spike height)


def shift_right(tile: Image.Image, px: int) -> Image.Image:
    w, h = tile.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    # shift opaque content px pixels right; wrap-around would be confusing, so clip
    out.paste(tile.crop((0, 0, w - px, h)), (px, 0))
    return out


def shift_up(tile: Image.Image, px: int) -> Image.Image:
    w, h = tile.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(tile.crop((0, px, w, h)), (0, 0))
    return out


def main() -> None:
    base = Image.open(ATLAS).convert("RGBA")
    bw, bh = base.size

    new_h = ROW1_Y + ROW1_H
    atlas = Image.new("RGBA", (bw, new_h), (0, 0, 0, 0))
    atlas.paste(base, (0, 0))

    # red_arrow: x=255, y=0, w=40, h=33
    arrow = base.crop((255, 0, 255 + 40, 0 + 33))
    atlas.paste(shift_right(arrow, 2), (255, ROW1_Y))

    # red_spike: x=297, y=0, w=59, h=42
    spike = base.crop((297, 0, 297 + 59, 0 + 42))
    atlas.paste(shift_up(spike, 2), (297, ROW1_Y))

    atlas.save(ATLAS)
    print(f"wrote {ATLAS} {atlas.size}")
    print("  red_arrow_f1 @ (255, 50, 40, 33)  — shift 2px right")
    print("  red_spike_f1 @ (297, 50, 59, 42)  — shift 2px up")


if __name__ == "__main__":
    main()
