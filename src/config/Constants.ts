/**
 * Central tuning + asset configuration.
 *
 * Almost every "feel" knob in Dodge Rush lives here so designers can balance the
 * game without hunting through scene code. The asset-slicing tables also live here
 * because the supplied art is hand-laid pixel art — if a frame looks slightly off,
 * adjust the numbers below rather than editing engine code.
 */

import { CHARACTER_KEY, CHARACTER_COMBO_FRAMES } from './CharacterSprite';

/** Logical (design) resolution. The game is rendered here and scaled to fit. */
export const GAME_WIDTH = 540;
export const GAME_HEIGHT = 960;
export const TARGET_FPS = 60;

/**
 * Manual build counter shown in-game next to the version (GME-016). Bump this by
 * hand with every QA/release build — keep it in sync with `versionCode` in
 * `mobile/app.json`. See mobile/README.md → "Version bump protocol".
 */
export const BUILD_NUMBER = 6;

/** Texture / animation lookup keys (avoid magic strings around the codebase). */
export const ASSET_KEYS = {
  CHARACTER: CHARACTER_KEY,
  OBSTACLES: 'obstacles',
  COIN: 'coin', // spinning-coin sprite strip
  PARTICLE: 'spark' // generated at runtime, never loaded from disk
} as const;

/** Spinning coin: 13 frames, 40px square cells. */
export const COIN_CFG = { frame: 40, frames: 13, animKey: 'coin-spin', frameRate: 9 } as const;

/**
 * "Sky City" infinite background (see docs/background-skycity.md).
 *
 * The sky is a FIXED full-screen skybox that cross-dissolves through a cycle of
 * zones (day -> dusk -> ... -> aurora -> repeat). Over it, several layers loop
 * vertically at different parallax speeds to sell an endless aerial descent:
 * distant clouds, a rare sci-fi cruiser, occasional steampunk airships, and
 * near clouds. Each vehicle also has an ADDITIVE neon-light layer. A translucent
 * per-zone "grade" wash tints the scene for atmosphere.
 *
 * Every knob below is tunable: zone length/cadence, crossfade window, per-layer
 * parallax + tint, grade strength, and vignette.
 */

/** A sky zone: its skybox texture key + the colours that tint the layers. */
export interface BgZone {
  id: string;
  name: string;
  sky: string; // skybox texture key (loaded from bg_sky_<id>.png)
  base: number; // opaque base sky colour painted as the camera clear (device-proof floor)
  skyTop: number; // vertical sky gradient — top (zenith)
  skyMid: number; // vertical sky gradient — middle
  skyBot: number; // vertical sky gradient — bottom (horizon)
  struct: number; // tint for distant silhouettes (far clouds / vehicles)
  cloudTint: number; // tint for the bright near clouds (foreground)
  grade: number; // atmospheric wash colour drawn over the silhouettes
  gradeA: number; // wash opacity (0..1)
}

/** Zone cycle + palette, ported from art-src/skycity/palettes.json. */
export const BG_ZONES: readonly BgZone[] = [
  { id: 'day',      name: 'Día Nublado',        sky: 'bg_sky_day',      base: 0x7fb8e8, skyTop: 0x1f4fb0, skyMid: 0x3f86d8, skyBot: 0xbfe8ff, struct: 0x2b3f7a, cloudTint: 0xbfe8ff, grade: 0x9fd0ff, gradeA: 0.1 },
  { id: 'dusk',     name: 'Atardecer Lavanda',  sky: 'bg_sky_dusk',     base: 0x6b5a93, skyTop: 0x3a1f6e, skyMid: 0x8a4fb0, skyBot: 0xd9a0d6, struct: 0x3a2a66, cloudTint: 0xd9a0d6, grade: 0xcaa0e6, gradeA: 0.14 },
  { id: 'sunset',   name: 'Ocaso Naranja',      sky: 'bg_sky_sunset',   base: 0xc8703f, skyTop: 0x4a1a66, skyMid: 0xe0568a, skyBot: 0xffd060, struct: 0x5a2a52, cloudTint: 0xffd060, grade: 0xff9a5a, gradeA: 0.18 },
  { id: 'twilight', name: 'Crepúsculo Magenta', sky: 'bg_sky_twilight', base: 0x6a2d72, skyTop: 0x2a0a4a, skyMid: 0x6a1a8a, skyBot: 0xb03a9a, struct: 0x3a1450, cloudTint: 0xb03a9a, grade: 0xc45ad6, gradeA: 0.16 },
  { id: 'night',    name: 'Noche Profunda',     sky: 'bg_sky_night',    base: 0x141a4a, skyTop: 0x070726, skyMid: 0x16208a, skyBot: 0x2b3fb0, struct: 0x1a1f55, cloudTint: 0x2b3fb0, grade: 0x3a52c4, gradeA: 0.12 },
  { id: 'aurora',   name: 'Aurora Boreal',      sky: 'bg_sky_aurora',   base: 0x163a5a, skyTop: 0x0a1248, skyMid: 0x1f3f9a, skyBot: 0x6fb0e0, struct: 0x1c2a66, cloudTint: 0x6fb0e0, grade: 0x5fd0e0, gradeA: 0.12 }
] as const;

/** One vertically-looping parallax layer drawn over the sky. */
export interface BgLayer {
  key: string; // texture key (bg_*.png)
  parallax: number; // scroll multiplier — smaller = further away / slower
  tile: number; // tile height in screen px (== the asset's downscaled height)
  /** none: untinted · struct: distant silhouette tint · cloud: near-cloud tint */
  tint: 'none' | 'struct' | 'cloud';
  additive?: boolean; // neon lights: ADD blend, never tinted
}

/**
 * Draw order (back -> front). The per-zone grade wash is injected right after the
 * silhouette layers (gradeBeforeKey) so distant structure recedes while the neon
 * lights and near clouds stay crisp on top.
 */
export const BG_LAYERS: readonly BgLayer[] = [
  { key: 'bg_clouds_far',       parallax: 0.18, tile: 675,  tint: 'struct' },
  { key: 'bg_spaceship',        parallax: 0.28, tile: 4800, tint: 'struct' },
  { key: 'bg_airships',         parallax: 0.34, tile: 1800, tint: 'struct' },
  // --- per-zone atmospheric grade wash is drawn here ---
  { key: 'bg_spaceship_lights', parallax: 0.28, tile: 4800, tint: 'none', additive: true },
  { key: 'bg_airships_lights',  parallax: 0.34, tile: 1800, tint: 'none', additive: true },
  { key: 'bg_clouds',           parallax: 0.52, tile: 675,  tint: 'cloud' }
] as const;

export const BG_CFG = {
  /** Index in BG_LAYERS the grade wash is drawn in front of (i.e. over silhouettes). */
  gradeBeforeKey: 'bg_spaceship_lights',
  /** Scroll distance (px of raw fall) each zone lasts before the next begins. */
  zoneLength: 9000,
  /** Fraction of a zone (at its tail) spent cross-dissolving into the next. */
  crossfadeFrac: 0.16,
  /** Edge-darkening vignette opacity on top of everything (0 disables it). */
  vignetteAlpha: 0.22
} as const;

/** All background texture keys that the preloader must fetch. */
export const BG_SKY_KEYS = BG_ZONES.map((z) => z.sky);
export const BG_LAYER_KEYS = BG_LAYERS.map((l) => l.key);

export const STORAGE_KEYS = {
  HIGH_SCORE: 'dodgerush.highscore', // CLASSIC mode best (legacy key — existing data = classic)
  HIGH_SCORE_RELAX: 'dodgerush.highscore.relax', // RELAX mode best (GME-012 — per-mode records)
  MUTED: 'dodgerush.muted',
  COINS: 'dodgerush.coins',
  OWNED_SKINS: 'dodgerush.skins',
  SELECTED_SKIN: 'dodgerush.skin',
  DIFFICULTY: 'dodgerush.difficulty', // selected difficulty mode id
  DAILY: 'dodgerush.daily', // daily-reward streak + daily-mission state (JSON)
  TOTAL_RUNS: 'dodgerush.totalruns',
  ACHIEVEMENTS: 'dodgerush.achievements' // unlocked achievement ids (JSON array — GME-GD-007)
} as const;

export const COLORS = {
  bgTop: 0x2a1a4a,
  bgBottom: 0xff9ecf,
  ink: '#2b1a3d',
  white: '#ffffff',
  accent: '#ff4f9a',
  accentDark: '#c81e63',
  gold: '#ffd54a',
  panel: 0x241640,
  panelStroke: 0xff7bb0
} as const;

/**
 * Zone milestones (GME-GD-006): a brief, non-intrusive banner shown the first
 * time the run's score crosses each threshold. Names are altitude-themed; the
 * score doubles as the "distance" metric (~10/s + combo bonuses).
 */
export interface ZoneMilestone {
  at: number; // score threshold
  name: string; // banner text
}

export const ZONE_MILESTONES: ZoneMilestone[] = [
  { at: 50, name: '¡Las Nubes!' },
  { at: 150, name: '¡Tormenta!' },
  { at: 300, name: '¡Estratosfera!' },
  { at: 500, name: '¡Órbita!' }
];

/**
 * Obstacle atlas slicing (named sub-rectangles inside the packed PNG).
 * These match the clean pixel-art atlas produced by scripts/build-obstacles.py
 * (a single 545x50 row of tightly-packed tiles).
 */
export interface ObstacleFrameDef {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Additional animation frames for obstacles that have >1 sprite frame.
 * Each entry maps `<frame>_f<n>` → atlas rect. Row 1 of the atlas (y=50) holds
 * these so they live alongside the base tiles without disturbing frame 0 coords.
 */
export interface ObstacleAnimFrameDef {
  name: string; // "<baseName>_f<n>"
  x: number;
  y: number;
  width: number;
  height: number;
}

export const OBSTACLE_ANIM_FRAMES: ObstacleAnimFrameDef[] = [
  { name: 'red_arrow_f1',  x: 255, y: 50, width: 40, height: 33 },
  { name: 'red_spike_f1',  x: 297, y: 50, width: 59, height: 42 },
  { name: 'gold_block_f1', x: 487, y: 50, width: 58, height: 39 }
];

export const OBSTACLE_FRAMES: ObstacleFrameDef[] = [
  { name: 'blue_bar', x: 0, y: 0, width: 53, height: 28 },
  { name: 'green_bar', x: 55, y: 0, width: 78, height: 30 },
  { name: 'purple_pillar', x: 135, y: 0, width: 25, height: 42 },
  { name: 'red_arrow', x: 255, y: 0, width: 40, height: 33 },
  { name: 'red_spike', x: 297, y: 0, width: 59, height: 42 },
  { name: 'stone_crack', x: 358, y: 0, width: 68, height: 34 },
  { name: 'blue_tile', x: 428, y: 0, width: 57, height: 34 },
  { name: 'gold_block', x: 487, y: 0, width: 58, height: 39 }
];

/** Player tuning. Speeds are in pixels-per-millisecond for frame-rate independence. */
export const PLAYER_CFG = {
  displayWidth: 122, // ~1:1 with the 120px cell -> crisp (no upscaling blur)
  startYRatio: 0.34, // vertical screen position the player holds while "falling"
  // (kept well below the top HUD so combo/celebration popups never overlap it)
  moveSpeed: 0.62, // horizontal travel speed
  // Forgiving collision box (the cell has transparent padding around the body).
  hitboxScaleX: 0.3,
  hitboxScaleY: 0.36,
  tiltDegrees: 9, // gentle bank into the direction of travel
  effortHoldMs: 360, // holding a direction longer than this -> straining animation
  faceFlipDelayMs: 90, // brief hold before mirroring -> debounces rapid dodge taps (no strobe, DR-06)
  bobAmp: 7, // subtle vertical "alive" bob (visual only, not collision; DR-03)
  bobSpeed: 0.005
} as const;

/** Barrier / hole tuning. The base gap & spacing shrink with difficulty. */
export const OBSTACLE_CFG = {
  bandHeight: 88, // thickness of each wall band
  spacingStart: 360, // vertical distance between barriers at game start
  spacingMin: 280, // closest spacing at high difficulty
  spacingShrinkPerSec: 0.9, // how fast barriers get more frequent
  gapStart: 210, // base safe-passage width at game start
  gapMin: 150, // narrowest base passage at high difficulty
  gapShrinkPerSec: 0.9, // how fast the base passage tightens
  edgePadding: 26, // keep the hole away from the very screen edges
  capFraction: 0.32, // 3-slice: each fixed end-cap is this fraction of the tile width
  reactionMinMs: 600, // guaranteed minimum reaction window (fairness)
  reachFactor: 0.82, // fraction of cross-screen travel a gap may shift per barrier
  poolSize: 10 // recycled barrier instances
} as const;

/**
 * Risk↔reward "fork" obstacle (GME-017). Some barriers present TWO gaps split by
 * a central pillar: the normal reachable gap is the EASY option (wide, near the
 * player's path) and a second, narrower gap is carved far to one side as the HARD
 * option. Taking the hard gap pays a score bonus (see SCORE_CFG.forkChoiceBonus).
 * The easy gap is always the fair, reachable one, so forks never cause an
 * unavoidable death and Relax stays accessible.
 */
export const FORK_CFG = {
  spawnChance: 0.38, // chance an *eligible* barrier becomes a fork
  minLevel: 1, // no forks before the first 30s difficulty step (let newcomers settle)
  minEasyGap: 160, // the normal gap must be at least this wide to host a fork
  hardRatio: 0.62, // hard gap width = easy gap width × this
  minHardGap: 100, // floor for the hard gap so it always stays passable (player ≈ 37px)
  minPillar: 44, // minimum solid divider between the two gaps (legibility)
  minOuterWall: 20, // keep a visible wall beyond the hard gap (never flush to the edge)
  telegraphColor: 0xffb020 // amber tint on the hard gap's posts ("more reward this way")
} as const;

/** Scrolling / fall-speed curve. */
export const SCROLL_CFG = {
  startSpeed: 0.2, // initial fall speed (px/ms)
  maxSpeed: 0.6, // speed cap
  accelPerSec: 0.006 // speed gained each second survived
  // Background depth comes from per-layer parallax in BG_LAYERS, not a global mult.
} as const;

/** Difficulty ramps in 30s steps (values interpolate smoothly between steps). */
export const DIFFICULTY_CFG = {
  stepSeconds: 30,
  maxStep: 8 // difficulty stops ramping past this step
} as const;

/** Scoring. */
export const SCORE_CFG = {
  pointsPerSecond: 10, // survival score
  pointsPerPass: 10, // base points per cleared obstacle (before combo multiplier)
  goldenBonus: 250, // instant points for threading a golden obstacle
  goldenBoostMs: 5000, // duration of the golden score boost
  goldenBoostMult: 2, // score multiplier while the golden boost is active
  nearMissBonus: 15, // extra points (× multiplier) for a tight pass
  nearMissMargin: 16, // px of clearance at/under which a pass counts as "close"
  // Risk↔reward (GME-017): a narrower gap pays a SCORE bonus on top of the pass
  // (speed stays decoupled per GME-GD-004). Scales linearly from 0 at riskGapWide
  // down to the full riskGapBonus at/below riskGapNarrow, then × the combo
  // multiplier. Purely additive — Relax's wider gaps simply earn less, never a
  // penalty — so the mode stays accessible.
  riskGapBonus: 20, // max extra points (× multiplier) for threading the tightest gap
  riskGapWide: 230, // gap width (px) at/above which a pass earns no risk bonus
  riskGapNarrow: 120, // gap width (px) at/below which the full risk bonus is paid
  riskFeedbackMin: 8, // only flash the "TIGHT!" popup once the risk bonus reaches this
  // Risk↔reward fork (GME-017): a "fork" obstacle offers an easy (wide/near) and a
  // hard (narrow/far) gap. Threading the HARD gap pays this extra, scaled by how
  // far apart the two gaps are (more distance committed = more reward). × combo.
  forkChoiceBonus: 35, // base extra points (× multiplier) for taking the hard gap
  forkSeparationRef: 200 // px between the two gaps that yields full distance scaling
} as const;

/**
 * Combo tiers (checked high-to-low). `at` = passes needed, `mult` = score
 * multiplier. Tiers up to x20 flash a numbered combo sprite (`frame`); the big
 * milestones (50, 100, then every 100) trigger a full cheer + escalating FX
 * (`fx`). The multiplier and combo speed-bonus both reset on losing a life.
 */
export interface ComboTier {
  at: number;
  mult: number;
  frame?: number; // numbered combo sprite (x2..x20)
  fx?: 'huge' | 'epic'; // celebration intensity for milestone tiers
}

export const COMBO_TIERS: ComboTier[] = [
  // Static milestones up to x1000. Above 1000 ComboManager generates tiers dynamically.
  // Every 100 from 100–1000: full cheer + screen flash.
  { at: 1000, mult: 350, fx: 'epic' },
  { at:  900, mult: 320, fx: 'epic' },
  { at:  800, mult: 290, fx: 'epic' },
  { at:  700, mult: 260, fx: 'epic' },
  { at:  600, mult: 230, fx: 'epic' },
  { at:  500, mult: 200, fx: 'epic' },
  { at:  400, mult: 160, fx: 'epic' },
  { at:  300, mult: 120, fx: 'epic' },
  { at:  200, mult:  90, fx: 'epic' },
  { at:  100, mult:  60, fx: 'epic' },
  // Every 10 from 30–90: big cheer.
  { at: 90, mult: 56, fx: 'huge' },
  { at: 80, mult: 52, fx: 'huge' },
  { at: 70, mult: 48, fx: 'huge' },
  { at: 60, mult: 44, fx: 'huge' },
  { at: 50, mult: 40, fx: 'huge' },
  { at: 40, mult: 34, fx: 'huge' },
  { at: 30, mult: 28, fx: 'huge' },
  // Sprite-frame milestones (numbered badge flashes on the character).
  { at: 20, mult: 20, frame: CHARACTER_COMBO_FRAMES.x20 },
  { at: 12, mult: 10, frame: CHARACTER_COMBO_FRAMES.x10 },
  { at:  7, mult:  5, frame: CHARACTER_COMBO_FRAMES.x5 },
  { at:  4, mult:  3, frame: CHARACTER_COMBO_FRAMES.x3 },
  { at:  2, mult:  2, frame: CHARACTER_COMBO_FRAMES.x2 },
];

/** Highest `at` value in COMBO_TIERS — ComboManager generates tiers dynamically above this. */
export const COMBO_STATIC_MAX = 1_000;

export const COMBO_CFG = {
  celebrateMs: 550, // how long the combo flash lasts before returning to flight (DR-29: was 850)
  speedPerMult: 0.012, // fall-speed added per multiplier step above 1
  speedBonusMax: 0.26 // cap on the combo speed bonus
} as const;

/*
 * Smash power — REMOVED (GME-008). There is intentionally no power/double-tap
 * config here. The double-tap-to-destroy mechanic was cut after design review:
 *   1. Breaks the single-input purity of the core loop (tap L / tap R, nothing else).
 *   2. Creates a natural pay-to-win vector if charges are ever monetised.
 *   3. Double-tap is ambiguous on a tap-to-move input scheme → accidental fires.
 *   4. Obscures skill-based progression (did I survive because I'm better, or because
 *      I used a charge?).
 * See docs/core-loop.md → "Decisión de diseño: por qué NO hay mecánica de destruir
 * obstáculos" for the full rationale and the checklist to evaluate any future revival.
 */

/** Lives & post-hit invincibility. */
export const LIVES_CFG = {
  count: 3,
  invincibleMs: 1500, // grace period after a crash
  blinkMs: 110, // blink interval while invincible
  maxComboSpeed: 0.86 // hard cap on (time speed + combo bonus)
} as const;

/**
 * Difficulty modes. CLASSIC is the tuned baseline; RELAX is a gentler curve for
 * younger / casual players (slower, wider gaps, more lives, a lower ceiling).
 * The multipliers scale the curves in DifficultyManager so all the fairness
 * guarantees still hold — RELAX just makes everything more forgiving.
 */
export type DifficultyModeId = 'classic' | 'relax';

export interface DifficultyMode {
  id: DifficultyModeId;
  label: string;
  blurb: string;
  speedScale: number; // multiplies start + max fall speed
  rampScale: number; // multiplies how fast speed/gap/spacing ramp with time
  gapScale: number; // multiplies the safe-passage width
  spacingScale: number; // multiplies the distance between barriers
  comboSpeedScale: number; // multiplies the combo speed bonus
  maxStep: number; // caps the difficulty step (spawn-mix hardening)
  lives: number; // starting lives
}

export const DIFFICULTY_MODES: Record<DifficultyModeId, DifficultyMode> = {
  classic: {
    id: 'classic',
    label: 'CLASSIC',
    blurb: 'One hit. Pure arcade.',
    speedScale: 1,
    rampScale: 1,
    gapScale: 1,
    spacingScale: 1,
    comboSpeedScale: 1,
    maxStep: DIFFICULTY_CFG.maxStep,
    lives: 1 // one-hit death (GME-015 / DEC-007 — arcade purity)
  },
  relax: {
    id: 'relax',
    label: 'RELAX',
    blurb: 'Slower & forgiving',
    speedScale: 0.78,
    rampScale: 0.5,
    gapScale: 1.28,
    spacingScale: 1.18,
    comboSpeedScale: 0.45,
    maxStep: 4,
    lives: 3 // kindness mechanic (GME-015 / DEC-007)
  }
} as const;

export const DEFAULT_DIFFICULTY: DifficultyModeId = 'relax'; // GME-015 — new players start in the forgiving mode

/**
 * Gap-legibility markers. Bright posts drawn on the inner (gap-facing) edge of
 * each wall so the safe passage reads instantly against busy backgrounds. The
 * #1 readability fix from the feel audit.
 */
export const GAP_MARKER_CFG = {
  enabled: true,
  width: 10, // bright-core post thickness (px)
  coreColor: 0xffffff, // bright core
  glowColor: 0x8fffc8, // minty "go here" outer glow (green reads as safe to kids)
  coreAlpha: 1,
  glowAlpha: 0.66,
  glowWidth: 28, // outer glow thickness (px)
  heightScale: 1.18, // posts stand a touch taller than the wall band -> "gateposts"
  arrowSize: 18, // inward chevron hinting "go between here"
  arrowAlpha: 0.95,
  pulseSpeed: 0.012
} as const;

/**
 * Daily reward (login streak) + daily mission. Coins are cosmetic-only currency,
 * so these are pure retention hooks with no pay-to-win pressure.
 */
export const DAILY_CFG = {
  // Streak rewards by consecutive day (capped at the last entry once maxed).
  streakRewards: [25, 40, 60, 90, 130, 180, 250],
  resetAfterHours: 48 // miss this long -> streak resets to day 1
} as const;

/**
 * Daily mission system — three missions per day (easy / medium / hard).
 *
 * MissionKind drives which RunStats field is read. 'smash' is intentionally
 * absent: the smash power was removed (GME-008 — see docs/core-loop.md).
 *
 * Difficulty tiers control reward size and, in DailyManager, how targets are
 * scaled to the player's personal best so missions are never trivial for experts
 * nor impossible for beginners.
 */
export type MissionKind = 'passes' | 'combo' | 'score';
export type MissionDifficulty = 'easy' | 'medium' | 'hard';

export interface MissionDef {
  kind: MissionKind;
  difficulty: MissionDifficulty;
  target: number;
  reward: number; // coins for easy/medium; ignored for hard (hard always gives a spin)
  label: (t: number) => string;
}

/**
 * Mission pool. DailyManager picks one easy + one medium + one hard per day,
 * deterministically from the date. No two missions on the same day share a kind.
 *
 * Targets here are baselines; DailyManager scales hard-tier targets against the
 * player's personal best so they remain achievable but not trivial.
 */
export const DAILY_MISSIONS: MissionDef[] = [
  // Easy — accumulative across runs, completable in 2-3 sessions.
  { kind: 'passes', difficulty: 'easy',   target: 50,  reward: 10,  label: (t) => `Dodge ${t} obstacles today`                        },
  { kind: 'score',  difficulty: 'easy',   target: 200, reward: 10,  label: (t) => `Earn ${t} total points today`                       },
  // target 4 = chain of 4 → x3 multiplier tier
  { kind: 'combo',  difficulty: 'easy',   target: 4,   reward: 10,  label: (_t) => `Reach a x3 combo in any run (dodge 4 in a row)`    },

  // Medium — accumulative, takes a real session to finish.
  { kind: 'passes', difficulty: 'medium', target: 150, reward: 25,  label: (t) => `Dodge ${t} obstacles today`                        },
  { kind: 'score',  difficulty: 'medium', target: 600, reward: 25,  label: (t) => `Earn ${t} total points today`                       },
  // target 12 = chain of 12 → x10 multiplier tier
  { kind: 'combo',  difficulty: 'medium', target: 12,  reward: 25,  label: (_t) => `Reach a x10 combo in any run (dodge 12 in a row)`  },

  // Hard — single-run goal, rewards a free spin.
  { kind: 'score',  difficulty: 'hard',   target: 800, reward: 0,   label: (t) => `Score ${t} in a single run`                        },
  { kind: 'passes', difficulty: 'hard',   target: 60,  reward: 0,   label: (t) => `Clear ${t} obstacles in one run`                   },
  // target 20 = chain of 20 → x20 multiplier tier (genuinely hard, achievable in one Classic run)
  { kind: 'combo',  difficulty: 'hard',   target: 20,  reward: 0,   label: (_t) => `Reach a x20 combo in one run (dodge 20 in a row)`  },
];
