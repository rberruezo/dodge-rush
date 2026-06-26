/**
 * The 10 obstacle archetypes from the design doc, each mapped 1:1 to a tile in
 * the obstacle atlas. Base spawn weights equal the design's spawn-rate percentages
 * (they sum to 100); DifficultyManager skews them toward the harder types over time.
 */
export enum ObstacleType {
  Straight = 'straight',
  Wide = 'wide',
  Narrow = 'narrow',
  Moving = 'moving',
  Danger = 'danger',
  Broken = 'broken',
  Glowing = 'glowing',
  Golden = 'golden'
}

export interface ObstacleTypeDef {
  type: ObstacleType;
  frame: string; // atlas frame used to tile the walls
  fill: number; // solid colour painted behind the tiles (no see-through walls)
  baseWeight: number; // spawn weight at difficulty 0 (== design spawn-rate %)
  gapFactor: number; // multiplier on the current base gap width
  bandFactor: number; // multiplier on the base band thickness
  diagonal: number; // gap bias: -1 left, 0 centre, +1 right
  moving: boolean; // oscillates horizontally (sine)
  danger: boolean; // red warning pulse (cosmetic; all collisions are fatal)
  glowing: boolean; // neon glow pulse
  golden: boolean; // reward obstacle (bonus + score boost)
  animFrames: number; // sprite animation frame count (1 = static)
  animMs: number; // ms per animation frame
}

/**
 * fill values are the dominant colour of each tile as reported by build-obstacles.py.
 * If a tile is redrawn, re-run the script and copy the printed fill= hex here.
 * Glowing fill was manually shifted to violet (0x7722ee) to distinguish it from
 * the blue Straight type (0x0ca8d8) which shares a similar hue in the source art.
 */
export const OBSTACLE_TYPES: Record<ObstacleType, ObstacleTypeDef> = {
  [ObstacleType.Straight]: {
    type: ObstacleType.Straight,
    frame: 'blue_bar',
    fill: 0x0ca8d8, // dominant: blue_bar — medium sky-blue
    baseWeight: 46,
    gapFactor: 1.25,
    bandFactor: 1,
    diagonal: 0,
    moving: false,
    danger: false,
    glowing: false,
    golden: false,
    animFrames: 1,
    animMs: 0
  },
  [ObstacleType.Wide]: {
    type: ObstacleType.Wide,
    frame: 'green_bar',
    fill: 0x30cca8, // dominant: green_bar — mint green
    baseWeight: 18,
    gapFactor: 0.95,
    bandFactor: 1.18,
    diagonal: 0,
    moving: false,
    danger: false,
    glowing: false,
    golden: false,
    animFrames: 1,
    animMs: 0
  },
  [ObstacleType.Narrow]: {
    type: ObstacleType.Narrow,
    frame: 'purple_pillar',
    fill: 0x903c78, // dominant: purple_pillar — deep magenta-purple
    baseWeight: 15,
    gapFactor: 0.66,
    bandFactor: 1,
    diagonal: 0,
    moving: false,
    danger: false,
    glowing: false,
    golden: false,
    animFrames: 1,
    animMs: 0
  },
  [ObstacleType.Moving]: {
    type: ObstacleType.Moving,
    frame: 'red_arrow',
    fill: 0xf02430, // dominant: red_arrow — vivid red
    baseWeight: 8,
    gapFactor: 0.92,
    bandFactor: 1,
    diagonal: 0,
    moving: true,
    danger: false,
    glowing: false,
    golden: false,
    animFrames: 2,
    animMs: 150
  },
  [ObstacleType.Danger]: {
    type: ObstacleType.Danger,
    frame: 'red_spike',
    fill: 0xe40c24, // dominant: red_spike — deep red
    baseWeight: 6,
    gapFactor: 0.74,
    bandFactor: 1.05,
    diagonal: 0,
    moving: false,
    danger: true,
    glowing: false,
    golden: false,
    animFrames: 2,
    animMs: 400
  },
  [ObstacleType.Broken]: {
    type: ObstacleType.Broken,
    frame: 'stone_crack',
    fill: 0x84849c, // dominant: stone_crack — cool grey
    baseWeight: 4,
    gapFactor: 1.0,
    bandFactor: 1,
    diagonal: 0,
    moving: false,
    danger: false,
    glowing: false,
    golden: false,
    animFrames: 1,
    animMs: 0
  },
  [ObstacleType.Glowing]: {
    type: ObstacleType.Glowing,
    frame: 'blue_tile',
    fill: 0x7722ee, // manually set to violet (source dominant was 0x24d8fc — too close to blue_bar)
    baseWeight: 2,
    gapFactor: 1.0,
    bandFactor: 1,
    diagonal: 0,
    moving: false,
    danger: false,
    glowing: true,
    golden: false,
    animFrames: 1,
    animMs: 0
  },
  [ObstacleType.Golden]: {
    type: ObstacleType.Golden,
    frame: 'gold_block',
    fill: 0xfca800, // dominant: gold_block — warm amber-gold
    baseWeight: 1,
    gapFactor: 1.05,
    bandFactor: 1,
    diagonal: 0,
    moving: false,
    danger: false,
    glowing: true,
    golden: true,
    animFrames: 2,
    animMs: 600
  }
};

export const ALL_OBSTACLE_TYPES: ObstacleTypeDef[] = Object.values(OBSTACLE_TYPES);
