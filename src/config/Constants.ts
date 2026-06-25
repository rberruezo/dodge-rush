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
  PARTICLE: 'spark' // generated at runtime, never loaded from disk
} as const;

/**
 * Background themes (a sunset -> twilight -> night day-cycle). Each is a
 * mirror-doubled, vertically-seamless texture (see scripts/build-backgrounds.py)
 * loaded from background_0/1/2.png.
 */
export const BG_THEME_KEYS = ['bg_sunset', 'bg_twilight', 'bg_night'] as const;

export const BG_CFG = {
  loopHeight: 1920, // height of the doubled texture (scroll wraps on this)
  changeEveryPasses: 12, // switch theme every N cleared obstacles
  crossfadeMs: 2400 // how long the scene cross-dissolve takes
} as const;

export const ANIM_KEYS = {
  IDLE: 'player-idle',
  FALL: 'player-fall',
  CHEER: 'player-cheer',
  BOOST: 'player-boost'
} as const;

export const STORAGE_KEYS = {
  HIGH_SCORE: 'dodgerush.highscore',
  MUTED: 'dodgerush.muted'
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
 * Re-packed by `scripts/build-character.py` into a clean, uniform 6x6 grid at
 * `public/assets/character.png` (50x50 cells). Frame map (index = row*6 + col):
 *   row 0 (0-5)   idle (front)
 *   row 1 (6-11)  side flight        -> falling / movement loop (faces LEFT)
 *   row 2 (12-17) cheer (arms up)    -> celebration / new best
 *   row 3 (18-23) combo: x1,x2,x3,x5,x10,x20  -> player sprite per combo tier
 *   row 4 (24-29) dizzy, sad-cloud, trophy, crown, star-eyes head, sad head
 *   row 5 (30-35) flight + sparkles  -> golden score-boost flight
 * The fly art faces LEFT, so we mirror (flipX) when moving right — see Player.
 */
export const CHARACTER_FRAME = {
  width: 50,
  height: 50
} as const;

/** Single-purpose frames (not animations). */
export const CHAR_FRAMES = {
  dizzy: 24,
  sadCloud: 25,
  trophy: 26,
  crown: 27,
  starHead: 28,
  sadHead: 29
} as const;

export const CHARACTER_ANIMS = {
  [ANIM_KEYS.IDLE]: { start: 0, end: 5, frameRate: 8, repeat: -1 },
  [ANIM_KEYS.FALL]: { start: 6, end: 11, frameRate: 14, repeat: -1 },
  [ANIM_KEYS.CHEER]: { start: 12, end: 17, frameRate: 10, repeat: -1 },
  [ANIM_KEYS.BOOST]: { start: 30, end: 35, frameRate: 16, repeat: -1 }
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
  { name: 'orange_block', x: 162, y: 0, width: 44, height: 47 },
  { name: 'ice_block', x: 208, y: 0, width: 45, height: 50 },
  { name: 'red_arrow', x: 255, y: 0, width: 40, height: 33 },
  { name: 'red_spike', x: 297, y: 0, width: 59, height: 42 },
  { name: 'stone_crack', x: 358, y: 0, width: 68, height: 34 },
  { name: 'blue_tile', x: 428, y: 0, width: 57, height: 34 },
  { name: 'gold_block', x: 487, y: 0, width: 58, height: 39 }
];

/** Player tuning. Speeds are in pixels-per-millisecond for frame-rate independence. */
export const PLAYER_CFG = {
  displayWidth: 108, // on-screen cell width; the sprite itself sits ~70% of this
  startYRatio: 0.26, // vertical screen position the player holds while "falling"
  moveSpeed: 0.62, // horizontal travel speed
  // Forgiving collision box. The re-packed cell has transparent padding, so the
  // hitbox is a small fraction of the cell (≈ the character's solid body).
  hitboxScaleX: 0.34,
  hitboxScaleY: 0.4,
  tiltDegrees: 7 // gentle bank into the direction of travel
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
  accelPerSec: 0.006, // speed gained each second survived
  bgParallax: 0.55 // background scrolls slower than obstacles for depth
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
  goldenBoostMult: 2 // score multiplier while the golden boost is active
} as const;

/**
 * Combo tiers (checked high-to-low). `at` = passes needed, `mult` = score
 * multiplier, `frame` = the player sprite showing that number while flying.
 * A higher combo also speeds the game up (see `speedPerMult`) — and both the
 * multiplier and the speed bonus reset whenever a life is lost.
 */
export const COMBO_CFG = {
  tiers: [
    { at: 20, mult: 20, frame: 23 },
    { at: 12, mult: 10, frame: 22 },
    { at: 7, mult: 5, frame: 21 },
    { at: 4, mult: 3, frame: 20 },
    { at: 2, mult: 2, frame: 19 }
  ],
  baseFrame: 18, // combo x1 (no tier) — but the fly animation is used instead
  speedPerMult: 0.012, // fall-speed added per multiplier step above 1
  speedBonusMax: 0.24 // cap on the combo speed bonus
} as const;

/** Lives & post-hit invincibility. */
export const LIVES_CFG = {
  count: 3,
  invincibleMs: 1500, // grace period after a crash
  blinkMs: 110, // blink interval while invincible
  maxComboSpeed: 0.86 // hard cap on (time speed + combo bonus)
} as const;
