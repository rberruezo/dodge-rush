# Dodge Rush 🪂

A retro-cute, portrait, infinite-faller for mobile. You're a tiny propeller-hat
hero falling forever — tap the **left** or **right** half of the screen to steer
through the holes in an endless run of obstacles. Survive longer, score higher.

Built with **Phaser 3 + TypeScript + Vite**, targeting **60 FPS** on phones.

## Quick start

```bash
npm install
npm run dev        # open the printed URL on desktop or your phone (same Wi-Fi)
```

```bash
npm run build      # type-check + production bundle into dist/
npm run preview     # serve the production build (also exposed on your LAN)
```

> The game is playable immediately with generated placeholder art. To get the
> intended look, drop the pixel-art images into `public/assets/`
> (`character.png`, `obstacles.png`, and the Sky City `bg_*.png` layers) — see
> [`public/assets/README.md`](public/assets/README.md) and, for the background,
> [`docs/background-skycity.md`](docs/background-skycity.md).

## Controls

| Action      | Touch                       | Keyboard         |
| ----------- | --------------------------- | ---------------- |
| Move left   | Tap / hold left half        | ◀ or `A`         |
| Move right  | Tap / hold right half       | ▶ or `D`         |
| Pause       | Pause button (top-right)    | `Esc` / `P`      |

## How it plays

- The hero holds a fixed vertical line while the world scrolls past — it _feels_
  like falling.
- Each obstacle is a full-width wall with one safe gap (the "hole"). Line up with
  the gap or crash.
- Speed ramps up and the gaps tighten the longer you survive.
- Score = survival time + a small bonus per hole cleared. High score is saved
  locally.

## Architecture

Component-based and engine-light: movement and collision are handled manually
for deterministic, frame-rate-independent behaviour (no physics engine needed).

```
src/
├─ main.ts                  App entry; mounts Phaser, handles viewport resize.
├─ config/
│  ├─ Constants.ts          All tuning knobs + asset-slicing tables (start here).
│  └─ GameConfig.ts         Phaser config: portrait, FIT scale, 60 FPS, pixelArt.
├─ scenes/                  One responsibility each, registered in GameConfig.
│  ├─ BootScene.ts          Global setup.
│  ├─ PreloadScene.ts       Loads art w/ progress bar; builds frames + anims.
│  ├─ MainMenuScene.ts      Title, animated hero, best score, mute toggle.
│  ├─ GameScene.ts          The game loop: orchestrates all systems.
│  ├─ PauseScene.ts         Modal overlay: resume / restart / menu.
│  └─ GameOverScene.ts      Results, "new best", retry / menu.
├─ objects/                 Visual game entities.
│  ├─ Player.ts             Falling hero: steer, tilt, hitbox, crash pose.
│  ├─ Barrier.ts            One wall-with-hole; pooled & recyclable.
│  └─ Background.ts         Sky City infinite background — see docs/background-skycity.md.
├─ systems/                 Reusable, mostly render-free logic.
│  ├─ ObstacleGenerator.ts  Infinite pooled barrier stream + difficulty + scoring hooks.
│  ├─ CollisionSystem.ts    AABB player-vs-barrier check.
│  ├─ ScoreManager.ts       Run score + persisted high score.
│  ├─ AnimationManager.ts   Registers character animations from the sheet.
│  ├─ InputController.ts    Touch halves + keyboard → -1/0/+1 steering intent.
│  └─ SoundManager.ts       Procedural Web Audio SFX (no audio files needed).
├─ ui/
│  ├─ Button.ts             Touch-friendly pixel button with press feedback.
│  └─ HUD.ts                Live score, best, pause button.
└─ utils/
   └─ TextureFactory.ts     Generates fallback textures + slices obstacle frames.
```

### Where to tweak things

- **Difficulty / feel:** `src/config/Constants.ts` (`SCROLL_CFG`, `OBSTACLE_CFG`,
  `PLAYER_CFG`, `SCORE_CFG`).
- **Asset slicing:** `CHARACTER_FRAME`, `CHARACTER_ANIMS`, `OBSTACLE_FRAMES` in
  the same file.
- **Resolution:** `GAME_WIDTH` / `GAME_HEIGHT` (logical design size; scaled to fit).

## Mobile notes

- Locked to portrait via a FIT scale mode; renders at one logical resolution and
  letterboxes/scales to any screen.
- Viewport meta + CSS disable pinch-zoom, double-tap zoom and rubber-band scroll.
- Audio unlocks on first tap (mobile autoplay policy).
- `delta` is clamped each frame so a background-tab stall can't tunnel obstacles
  through the player.

## Testing

```bash
npm run test:run   # 99 tests / 13 suites (Vitest, Node ≥20)
```

Manual passes that can't be automated (game feel, audio, device render) live in
[`QA-MANUAL-CHECKLIST.md`](QA-MANUAL-CHECKLIST.md); strategy in
[`QA-PLAN.md`](QA-PLAN.md), case catalogue in [`USE-CASES.md`](USE-CASES.md).

## More docs

- Design & launch: [`docs/gdd.md`](docs/gdd.md) (hub) → core-loop, skins, monetization, ASO.
- Android build/sideload: [`mobile/README.md`](mobile/README.md).
- Planning & decisions: [`BACKLOG.md`](BACKLOG.md).
