#!/usr/bin/env python3
"""
BRN-004 — Final app branding assets for the Expo/Play-Store build.

Follows docs/visual-art-direction.md: the propeller-pilot hero must be the
recognisable centrepiece (legible at 60x60), flat game art, brand colour
#1a1030 + the menu's pink/white "DODGE RUSH" title. We DERIVE from the painted
hero (public/assets/character.png, hover frame 0) — no new style introduced.

Outputs (sizes match the existing files / Expo + Play-Store specs):
  mobile/assets/icon.png           1024x1024  (downscales to the 512 store icon)
  mobile/assets/adaptive-icon.png  1024x1024  foreground, hero inside the safe zone
  mobile/assets/splash.png         1242x2436  portrait, logo + hero centred
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERO_SRC = os.path.join(ROOT, "public/assets/character.png")
OUT = os.path.join(ROOT, "mobile/assets")

# brand palette
BG_DEEP = (26, 16, 48)      # #1a1030 (app.json backgroundColor)
BG_GLOWC = (78, 42, 104)    # purple glow centre
GLOW_PINK = (255, 90, 180)  # neon magenta halo
WHITE = (255, 255, 255)
PINK = (255, 79, 154)       # #ff4f9a (COLORS.accent)
OUTLINE = (24, 12, 36)

FONTS = [
    ("/System/Library/Fonts/Menlo.ttc", 1),   # Menlo Bold (monospace, matches menu)
    ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 0),
    ("/System/Library/Fonts/Arial Black.ttf", 0),
]


def font(size):
    for path, idx in FONTS:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size, index=idx)
            except Exception:
                continue
    return ImageFont.load_default()


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def fill_radial(img, cx, cy, r, inner, outer):
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, img.width, img.height], fill=outer + (255,))
    for i in range(int(r), 0, -1):
        d.ellipse([cx - i, cy - i, cx + i, cy + i], fill=lerp(inner, outer, i / r) + (255,))


def glow(size, cx, cy, r, color, max_a):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(int(r), 0, -1):
        a = int(max_a * (1 - i / r) ** 1.7)
        d.ellipse([cx - i, cy - i, cx + i, cy + i], fill=color + (a,))
    return layer


def hero(target_h):
    im = Image.open(HERO_SRC).convert("RGBA")
    cell = im.crop((0, 0, 120, 120))
    cell = cell.crop(cell.getbbox())           # tight to content (incl. propeller)
    w, h = cell.size
    s = target_h / h
    return cell.resize((max(1, round(w * s)), max(1, round(h * s))), Image.NEAREST)


def shadow(img, color=(0, 0, 0, 95)):
    s = Image.new("RGBA", img.size, (0, 0, 0, 0))
    s.paste(Image.new("RGBA", img.size, color), (0, 0), img.split()[3])
    return s


def paste_centered(base, img, cx, cy, with_shadow=True, dx=0, dy=0):
    x, y = round(cx - img.width / 2) + dx, round(cy - img.height / 2) + dy
    if with_shadow:
        base.alpha_composite(shadow(img), (x + round(img.width * 0.04), y + round(img.height * 0.05)))
    base.alpha_composite(img, (x, y))


def build_icon():
    S = 1024
    img = Image.new("RGBA", (S, S), BG_DEEP + (255,))
    fill_radial(img, S // 2, int(S * 0.46), S * 0.72, BG_GLOWC, BG_DEEP)
    img.alpha_composite(glow((S, S), S // 2, int(S * 0.52), 360, GLOW_PINK, 135))
    paste_centered(img, hero(int(S * 0.66)), S / 2, S * 0.54)
    img.save(os.path.join(OUT, "icon.png"))
    print("wrote icon.png", img.size)


def build_adaptive():
    S = 1024  # full canvas; content kept inside the ~66% safe zone (mask-proof)
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))   # transparent (bg set in app.json)
    img.alpha_composite(glow((S, S), S // 2, S // 2, 300, GLOW_PINK, 110))
    paste_centered(img, hero(int(S * 0.52)), S / 2, S / 2)   # ~530px, well inside safe zone
    img.save(os.path.join(OUT, "adaptive-icon.png"))
    print("wrote adaptive-icon.png", img.size)


def title(d, cx, top, scale=1.0):
    f = font(int(190 * scale))
    for line, color, dy in (("DODGE", WHITE, 0), ("RUSH", PINK, int(200 * scale))):
        bb = d.textbbox((0, 0), line, font=f)
        w = bb[2] - bb[0]
        x = cx - w / 2 - bb[0]
        y = top + dy
        d.text((x, y), line, font=f, fill=color,
               stroke_width=max(3, int(10 * scale)), stroke_fill=OUTLINE)


def build_splash():
    W, H = 1242, 2436
    img = Image.new("RGBA", (W, H), BG_DEEP + (255,))
    fill_radial(img, W // 2, int(H * 0.46), H * 0.5, BG_GLOWC, BG_DEEP)
    img.alpha_composite(glow((W, H), W // 2, int(H * 0.55), 560, GLOW_PINK, 120))
    d = ImageDraw.Draw(img)
    title(d, W / 2, int(H * 0.18), scale=1.0)
    paste_centered(img, hero(int(H * 0.30)), W / 2, int(H * 0.62))
    # tagline
    tf = font(58)
    tag = "TAP LEFT / RIGHT TO DODGE"
    bb = d.textbbox((0, 0), tag, font=tf)
    d.text((W / 2 - (bb[2] - bb[0]) / 2 - bb[0], int(H * 0.80)), tag, font=tf,
           fill=(210, 200, 230), stroke_width=2, stroke_fill=OUTLINE)
    img.save(os.path.join(OUT, "splash.png"))
    print("wrote splash.png", img.size)


if __name__ == "__main__":
    build_icon()
    build_adaptive()
    build_splash()
