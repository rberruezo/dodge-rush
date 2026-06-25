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
  HOVER: 'player-hover', // not steering (alive idle float)
  MOVE: 'player-move', // steering, low effort
  MOVE_HARD: 'player-move-hard', // steering held, straining
  BOOST: 'player-boost', // golden score boost
  CHEER: 'player-cheer' // celebration
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
  displayWidth: 122, // ~1:1 with the 120px cell -> crisp (no upscaling blur)
  startYRatio: 0.26, // vertical screen position the player holds while "falling"
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
    { at: 20, mult: 20, frame: 35 },
    { at: 12, mult: 10, frame: 34 },
    { at: 7, mult: 5, frame: 33 },
    { at: 4, mult: 3, frame: 32 },
    { at: 2, mult: 2, frame: 31 }
  ],
  celebrateMs: 850, // how long the combo sprite flashes before returning to flight
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
