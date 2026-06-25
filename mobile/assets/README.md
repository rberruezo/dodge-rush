# App icons & splash

Expo needs these PNGs to exist before `prebuild` / build. Drop them here:

| File                  | Size        | Notes                                            |
| --------------------- | ----------- | ------------------------------------------------ |
| `icon.png`            | 1024×1024   | Store/app icon. The propeller-hat hero on `#1a1030`. |
| `adaptive-icon.png`   | 1024×1024   | Android adaptive foreground (safe zone centered). |
| `splash.png`          | ~1242×2436  | Launch screen; `contain` on `#1a1030`.            |

Quick start: reuse the hero from `../../public/assets/character.png` (frame 0,
the front hover pose) centered on the brand background `#1a1030`.

Until real art is added you can generate flat placeholders so builds don't fail.
The store listing needs higher-res marketing assets too (feature graphic
1024×500, 4–8 screenshots) — keep those in your store console, not in the repo.
