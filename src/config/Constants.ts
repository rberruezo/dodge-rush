/**
 * Central tuning + asset configuration.
 *
 * Almost every "feel" knob in Dodge Rush lives here so designers can balance the
 * game without hunting through scene code. The asset-slicing tables also live here
 * because the supplied art is hand-laid pixel art — if a frame looks slightly off,
 * adjust the numbers below rather than editing engine code.
 */

/** Logical (design) resolution. The game is rendered here and scaled to fit. */
export const GAME_WIDTH = 540;
export const GAME_HEIGHT = 960;
export const TARGET_FPS = 60;

/** Texture / animation lookup keys (avoid magic strings around the codebase). */
export const ASSET_KEYS = {
  CHARACTER: 'character',
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
  struct: number; // tint for distant silhouettes (far clouds / vehicles)
  cloudTint: number; // tint for the bright near clouds (foreground)
  grade: number; // atmospheric wash colour drawn over the silhouettes
  gradeA: number; // wash opacity (0..1)
}

/** Zone cycle + palette, ported from art-src/skycity/palettes.json. */
export const BG_ZONES: readonly BgZone[] = [
  { id: 'day',      name: 'Día Nublado',        sky: 'bg_sky_day',      struct: 0x2b3f7a, cloudTint: 0xbfe8ff, grade: 0x9fd0ff, gradeA: 0.1 },
  { id: 'dusk',     name: 'Atardecer Lavanda',  sky: 'bg_sky_dusk',     struct: 0x3a2a66, cloudTint: 0xd9a0d6, grade: 0xcaa0e6, gradeA: 0.14 },
  { id: 'sunset',   name: 'Ocaso Naranja',      sky: 'bg_sky_sunset',   struct: 0x5a2a52, cloudTint: 0xffd060, grade: 0xff9a5a, gradeA: 0.18 },
  { id: 'twilight', name: 'Crepúsculo Magenta', sky: 'bg_sky_twilight', struct: 0x3a1450, cloudTint: 0xb03a9a, grade: 0xc45ad6, gradeA: 0.16 },
  { id: 'night',    name: 'Noche Profunda',     sky: 'bg_sky_night',    struct: 0x1a1f55, cloudTint: 0x2b3fb0, grade: 0x3a52c4, gradeA: 0.12 },
  { id: 'aurora',   name: 'Aurora Boreal',      sky: 'bg_sky_aurora',   struct: 0x1c2a66, cloudTint: 0x6fb0e0, grade: 0x5fd0e0, gradeA: 0.12 }
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

export const ANIM_KEYS = {
  HOVER: 'player-hover', // not steering (alive idle float)
  MOVE: 'player-move', // steering, low effort
  MOVE_HARD: 'player-move-hard', // steering held, straining
  BOOST: 'player-boost', // golden score boost
  CHEER: 'player-cheer' // celebration
} as const;

export const STORAGE_KEYS = {
  HIGH_SCORE: 'dodgerush.highscore',
  MUTED: 'dodgerush.muted',
  COINS: 'dodgerush.coins',
  OWNED_SKINS: 'dodgerush.skins',
  SELECTED_SKIN: 'dodgerush.skin',
  DIFFICULTY: 'dodgerush.difficulty', // selected difficulty mode id
  DAILY: 'dodgerush.daily' // daily-reward streak + daily-mission state (JSON)
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
 * Character sprite-sheet slicing.
 *
 * Re-packed by `scripts/build-character.py` into a clean 6x7 grid at
 * `public/assets/character.png` (120px cells — rendered ~1:1 so it stays crisp
 * against the detailed background). Frame map (index = row*6 + col):
 *   row 0 (0-5)   hover (front)            -> not steering (alive float)
 *   row 1 (6-11)  side flight, calm        -> moving, low effort
 *   row 2 (12-17) side flight, straining   -> moving held, high effort
 *   row 3 (18-23) flight + sparkles        -> golden score boost
 *   row 4 (24-29) cheer (arms up)          -> celebration
 *   row 5 (30-35) combo x1,x2,x3,x5,x10,x20-> brief combo celebration flash
 *   row 6 (36-41) dizzy, sad-cloud, trophy, crown, star head, sad head
 * The fly art faces LEFT, so we mirror (flipX) when moving right — see Player.
 */
export const CHARACTER_FRAME = {
  width: 120,
  height: 120
} as const;

/** Single-purpose frames (not animations). */
export const CHAR_FRAMES = {
  dizzy: 36,
  sadCloud: 37,
  trophy: 38,
  crown: 39,
  starHead: 40,
  sadHead: 41
} as const;

export const CHARACTER_ANIMS = {
  [ANIM_KEYS.HOVER]: { start: 0, end: 5, frameRate: 7, repeat: -1 },
  [ANIM_KEYS.MOVE]: { start: 6, end: 11, frameRate: 12, repeat: -1 },
  [ANIM_KEYS.MOVE_HARD]: { start: 12, end: 17, frameRate: 16, repeat: -1 },
  [ANIM_KEYS.BOOST]: { start: 18, end: 23, frameRate: 16, repeat: -1 },
  [ANIM_KEYS.CHEER]: { start: 24, end: 29, frameRate: 10, repeat: -1 }
} as const;

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
  bobAmp: 4, // subtle vertical "alive" bob (visual only, not collision)
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
  nearMissMargin: 16 // px of clearance at/under which a pass counts as "close"
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
  { at: 500, mult: 200, fx: 'epic' },
  { at: 400, mult: 160, fx: 'epic' },
  { at: 300, mult: 120, fx: 'epic' },
  { at: 200, mult: 90, fx: 'epic' },
  { at: 100, mult: 60, fx: 'epic' },
  { at: 50, mult: 35, fx: 'huge' },
  { at: 20, mult: 20, frame: 35 },
  { at: 12, mult: 10, frame: 34 },
  { at: 7, mult: 5, frame: 33 },
  { at: 4, mult: 3, frame: 32 },
  { at: 2, mult: 2, frame: 31 }
];

export const COMBO_CFG = {
  celebrateMs: 850, // how long the combo flash lasts before returning to flight
  speedPerMult: 0.012, // fall-speed added per multiplier step above 1
  speedBonusMax: 0.26 // cap on the combo speed bonus
} as const;

/**
 * Smash power (double-tap a side). Shatters the next approaching obstacle so the
 * player passes through it safely (counts as a clean pass). Has a cooldown.
 */
export const POWER_CFG = {
  doubleTapMs: 300, // two taps on the same side within this = activate the power
  cooldownMs: 3000 // recharge time
} as const;

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
    blurb: 'The full challenge',
    speedScale: 1,
    rampScale: 1,
    gapScale: 1,
    spacingScale: 1,
    comboSpeedScale: 1,
    maxStep: DIFFICULTY_CFG.maxStep,
    lives: LIVES_CFG.count
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
    lives: 5
  }
} as const;

export const DEFAULT_DIFFICULTY: DifficultyModeId = 'classic';

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

/** Daily mission archetypes — one is chosen deterministically per calendar day. */
export type MissionKind = 'passes' | 'combo' | 'score' | 'smash';

export interface MissionDef {
  kind: MissionKind;
  target: number;
  reward: number;
  label: (t: number) => string;
}

export const DAILY_MISSIONS: MissionDef[] = [
  { kind: 'passes', target: 40, reward: 80, label: (t) => `Clear ${t} obstacles in one run` },
  { kind: 'combo', target: 12, reward: 90, label: (t) => `Reach a x10 combo (chain ${t})` },
  { kind: 'score', target: 600, reward: 100, label: (t) => `Score ${t} in a single run` },
  { kind: 'smash', target: 5, reward: 70, label: (t) => `SMASH ${t} obstacles in one run` }
];
