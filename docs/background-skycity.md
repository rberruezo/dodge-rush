# Sky City — infinite background

The aerial-descent background. A **fixed** skybox cross-dissolves through a cycle
of zones (day → dusk → … → aurora → repeat) while several layers **loop
vertically at different parallax speeds**, selling an endless fall. Two of those
layers are vehicles (steampunk airships, a rare sci-fi cruiser) with additive
neon lights, and a translucent per-zone "grade" wash ties the palette together.

- Strategy + per-frame composition: [`src/objects/Background.ts`](../src/objects/Background.ts)
- All tunable parameters: `BG_ZONES`, `BG_LAYERS`, `BG_CFG` in [`src/config/Constants.ts`](../src/config/Constants.ts)
- Source art + the original spec: [`art-src/skycity/`](../art-src/skycity/) (`README-source.md`, `palettes.json`)
- Asset build: [`scripts/build-backgrounds.py`](../scripts/build-backgrounds.py)

## Composition (back → front)

| # | Layer | Source | Behaviour |
|---|---|---|---|
| 1 | Sky (current + next) | `bg_sky_<zone>` 540×960 | **Fixed** full screen. Two stacked images cross-dissolve as the zone changes. |
| 2 | Far clouds | `bg_clouds_far` | Loops vertically, parallax 0.18. Tinted by zone (`struct`). |
| 2 | Spaceship | `bg_spaceship` | Very tall tile (4800) → **rare**. Parallax 0.28. Tinted (`struct`). |
| 2 | Airships | `bg_airships` | Tall tile (1800) → **occasional**. Parallax 0.34. Tinted (`struct`). |
| 3 | Grade wash | — | Full-screen translucent rect (`grade` colour @ `gradeA`). Recedes the distant silhouettes. |
| 4 | Spaceship lights | `bg_spaceship_lights` | **ADD** blend, never tinted. Scrolls in lock-step with the spaceship. |
| 4 | Airship lights | `bg_airships_lights` | **ADD** blend, never tinted. Lock-step with airships. |
| 5 | Near clouds | `bg_clouds` | Bright foreground. Loops, parallax 0.52. Tinted by zone (`cloudTint`). |
| 6 | Vignette | `bg_vignette` (procedural) | Optional edge darkening, opacity `BG_CFG.vignetteAlpha`. |

## How the infinite loop works

`scrollY` is the raw fall distance (accumulated `speed × dt`). Every looping layer
is a single seamless tile, drawn as a small stack of plain `Image`s that we
reposition each frame:

```
o = (scrollY × parallax) mod tileHeight   // content scrolls up as you fall
sprite[j].y = -o + (j - 1) × tileHeight   // one tile above the top, rest below
```

We keep `ceil(screenH / tileHeight) + 2` sprites per layer — always enough to
cover the screen with one spare entering from below. Because each tile's art
wraps at its top/bottom edges, the join is seamless. (We deliberately do **not**
use Phaser `TileSprite`: the downscaled tiles are non-power-of-two, which can tile
incorrectly in WebGL — hand-stacked Images avoid that entirely.)

**Tile height = appearance frequency.** A taller tile means the content inside it
comes round less often: near clouds (675) are frequent, airships (1800)
occasional, the cruiser (4800) rare. To make something rarer, regenerate its
source art on a taller canvas.

## The zone cycle

```
zoneFloat = scrollY / zoneLength
zone      = floor(zoneFloat) mod BG_ZONES.length
frac      = fractional part
```

For the last `crossfadeFrac` of each zone, the next zone's sky fades in on top
(`t` ramps 0→1) and the tint/grade colours interpolate, so transitions are
smooth. The sky textures are only swapped when the integer zone index changes.

Each scene can start at a different point by passing `startScrollY` to
`new Background(scene, startScrollY)` — the menus use this to show different
zones (e.g. Shop opens in `night`, `BG_CFG.zoneLength * 4`). `MainMenu` hands its
`bg.scroll` to `Game` so the descent continues without a jump.

## Tuning

All knobs live in [`src/config/Constants.ts`](../src/config/Constants.ts):

| Where | Knob | Effect |
|---|---|---|
| `BG_CFG` | `zoneLength` | Fall distance per zone. Larger = zones last longer. |
| `BG_CFG` | `crossfadeFrac` | Fraction of a zone spent dissolving into the next (0–1). |
| `BG_CFG` | `vignetteAlpha` | Edge-darkening strength; `0` disables the vignette. |
| `BG_CFG` | `gradeBeforeKey` | Which layer the grade wash is drawn in front of. |
| `BG_LAYERS[i]` | `parallax` | Scroll speed multiplier. Smaller = further/slower. |
| `BG_LAYERS[i]` | `tile` | Tile height in px (must match the asset) → appearance frequency. |
| `BG_LAYERS[i]` | `tint` | `none` (lights) · `struct` (distant) · `cloud` (foreground). |
| `BG_ZONES[i]` | `sky` | Skybox texture key for the zone. |
| `BG_ZONES[i]` | `struct` / `cloudTint` | Tint applied to distant silhouettes / near clouds. |
| `BG_ZONES[i]` | `grade` / `gradeA` | Atmospheric wash colour + opacity. |

Add a zone by appending to `BG_ZONES` (and adding a `bg_sky_<id>.png`). Add a
parallax layer by appending to `BG_LAYERS` and its art. The preloader and
`Background` pick both up automatically from `BG_SKY_KEYS` / `BG_LAYER_KEYS`.

## Assets

`scripts/build-backgrounds.py` downscales the 720-wide source art in
`art-src/skycity/` to the game's 540px logical width and writes
`public/assets/bg_*.png` (skies → 540×960; clouds → 540×675; airships → 540×1800;
spaceship → 540×4800). Heights stay proportional so the frequency relationship is
preserved. If any asset fails to load at runtime, `TextureFactory` generates a
procedural stand-in (gradient skies, soft silhouettes, neon dots), so the game
always reaches the menu.

```bash
python3 scripts/build-backgrounds.py   # regenerate public/assets/bg_*.png
```
