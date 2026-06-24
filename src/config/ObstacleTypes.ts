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
}

export const OBSTACLE_TYPES: Record<ObstacleType, ObstacleTypeDef> = {
  [ObstacleType.Straight]: {
    type: ObstacleType.Straight,
    frame: 'blue_bar',
    fill: 0x0ca8d8,
    baseWeight: 46,
    gapFactor: 1.25,
    bandFactor: 1,
    diagonal: 0,
    moving: false,
    danger: false,
    glowing: false,
    golden: false
  },
  [ObstacleType.Wide]: {
    type: ObstacleType.Wide,
    frame: 'green_bar',
    fill: 0x30cca8,
    baseWeight: 18,
    gapFactor: 0.95,
    bandFactor: 1.18,
    diagonal: 0,
    moving: false,
    danger: false,
    glowing: false,
    golden: false
  },
  [ObstacleType.Narrow]: {
    type: ObstacleType.Narrow,
    frame: 'purple_pillar',
    fill: 0x903c78,
    baseWeight: 15,
    gapFactor: 0.66,
    bandFactor: 1,
    diagonal: 0,
    moving: false,
    danger: false,
    glowing: false,
    golden: false
  },
  [ObstacleType.Moving]: {
    type: ObstacleType.Moving,
    frame: 'red_arrow',
    fill: 0xf02430,
    baseWeight: 8,
    gapFactor: 0.92,
    bandFactor: 1,
    diagonal: 0,
    moving: true,
    danger: false,
    glowing: false,
    golden: false
  },
  [ObstacleType.Danger]: {
    type: ObstacleType.Danger,
    frame: 'red_spike',
    fill: 0xe40c24,
    baseWeight: 6,
    gapFactor: 0.74,
    bandFactor: 1.05,
    diagonal: 0,
    moving: false,
    danger: true,
    glowing: false,
    golden: false
  },
  [ObstacleType.Broken]: {
    type: ObstacleType.Broken,
    frame: 'stone_crack',
    fill: 0x84849c,
    baseWeight: 4,
    gapFactor: 1.0,
    bandFactor: 1,
    diagonal: 0,
    moving: false,
    danger: false,
    glowing: false,
    golden: false
  },
  [ObstacleType.Glowing]: {
    type: ObstacleType.Glowing,
    frame: 'blue_tile',
    fill: 0x24d8fc,
    baseWeight: 2,
    gapFactor: 1.0,
    bandFactor: 1,
    diagonal: 0,
    moving: false,
    danger: false,
    glowing: true,
    golden: false
  },
  [ObstacleType.Golden]: {
    type: ObstacleType.Golden,
    frame: 'gold_block',
    fill: 0xfca800,
    baseWeight: 1,
    gapFactor: 1.05,
    bandFactor: 1,
    diagonal: 0,
    moving: false,
    danger: false,
    glowing: true,
    golden: true
  }
};

export const ALL_OBSTACLE_TYPES: ObstacleTypeDef[] = Object.values(OBSTACLE_TYPES);
