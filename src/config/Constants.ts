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
  BACKGROUND: 'background',
  OBSTACLES: 'obstacles',
  PARTICLE: 'spark' // generated at runtime, never loaded from disk
} as const;

export const ANIM_KEYS = {
  IDLE: 'player-idle',
  FALL: 'player-fall',
  HURT: 'player-hurt',
  CHEER: 'player-cheer'
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
 * NOTE: the raw art is an irregular AI grid (varying pitch). It is re-packed by
 * `scripts/build-character.py` into a clean, uniform 6-column x 5-row sheet at
 * `public/assets/character.png` with these exact cell dimensions. Frames are
 * numbered left-to-right, top-to-bottom starting at 0:
 *   row 0 (0-5)   idle (front-facing)
 *   row 1 (6-11)  jet flight  -> the falling loop (faces RIGHT by default)
 *   row 2 (12-17) flight variant
 *   row 3 (18-23) dizzy / hurt
 *   row 4 (24-29) cheer / celebrate
 * The sprite's natural orientation faces RIGHT, so we mirror (flipX) when moving
 * left — see Player.steer(). Cells are small (downscaled to a pixel-art palette);
 * the game upscales them nearest-neighbour for crisp pixels.
 */
export const CHARACTER_FRAME = {
  width: 48,
  height: 60
} as const;

export const CHARACTER_ANIMS = {
  [ANIM_KEYS.IDLE]: { start: 0, end: 5, frameRate: 8, repeat: -1 },
  [ANIM_KEYS.FALL]: { start: 6, end: 11, frameRate: 14, repeat: -1 },
  [ANIM_KEYS.HURT]: { start: 18, end: 23, frameRate: 10, repeat: 0 },
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

/** Combo multiplier thresholds (checked high-to-low). */
export const COMBO_CFG = {
  tiers: [
    { at: 20, mult: 5 },
    { at: 10, mult: 3 },
    { at: 5, mult: 2 }
  ]
} as const;
