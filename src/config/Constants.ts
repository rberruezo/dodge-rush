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
  OBSTACLES: 'obstacles'
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
 * Obstacle pack slicing (named sub-rectangles inside the single packed PNG).
 * Coordinates are for a 1024x1024 source sheet. The barrier walls use these as
 * stretched tiles, so approximate values still render cleanly — fine-tune for polish.
 */
export interface ObstacleFrameDef {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const OBSTACLE_FRAMES: ObstacleFrameDef[] = [
  { name: 'blue_bar', x: 88, y: 70, width: 232, height: 118 },
  { name: 'green_bar', x: 362, y: 68, width: 316, height: 122 },
  { name: 'purple_pillar', x: 790, y: 52, width: 104, height: 156 },
  { name: 'orange_block', x: 118, y: 268, width: 176, height: 172 },
  { name: 'ice_block', x: 332, y: 268, width: 182, height: 168 },
  { name: 'red_arrow', x: 612, y: 288, width: 400, height: 128 },
  { name: 'red_spike', x: 66, y: 508, width: 244, height: 176 },
  { name: 'stone_crack', x: 372, y: 512, width: 286, height: 160 },
  { name: 'blue_tile', x: 700, y: 520, width: 250, height: 140 },
  { name: 'gold_block', x: 392, y: 742, width: 232, height: 148 }
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

/** Barrier / hole tuning. */
export const OBSTACLE_CFG = {
  bandHeight: 76, // thickness of each wall band
  spacing: 330, // vertical gap between consecutive barriers
  gapWidthStart: 220, // safe-passage width at game start
  gapWidthMin: 132, // hardest (narrowest) passage
  gapShrinkPerSec: 1.6, // how fast the passage tightens
  edgePadding: 18, // keep the hole away from the very screen edges
  poolSize: 8 // recycled barrier instances
} as const;

/** Scrolling / difficulty curve. */
export const SCROLL_CFG = {
  startSpeed: 0.2, // initial fall speed
  maxSpeed: 0.64, // speed cap
  accelPerSec: 0.0065, // speed gained each second survived
  bgParallax: 0.55 // background scrolls slower than obstacles for depth
} as const;

/** Scoring. */
export const SCORE_CFG = {
  pointsPerSecond: 10,
  pointsPerPass: 5
} as const;
