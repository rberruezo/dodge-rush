import { OBSTACLE_CFG, PLAYER_CFG, GAME_WIDTH } from '../config/Constants';
import { ObstacleType, ObstacleTypeDef, OBSTACLE_TYPES } from '../config/ObstacleTypes';
import { DifficultySnapshot, DifficultyManager } from './DifficultyManager';

export interface PlannedGap {
  def: ObstacleTypeDef;
  center: number; // gap centre x
  gapWidth: number; // safe-passage width
  band: number; // wall band thickness
  amp: number; // horizontal oscillation amplitude (0 = static)
  omega: number; // oscillation angular speed
}

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/**
 * Pure, Phaser-free gap placement.
 *
 * Decides the obstacle type, gap width/band thickness, and a *reachable* gap
 * centre for the next barrier — clamped so it can never shift further than the
 * player can travel before it arrives (the design's "no unavoidable deaths"
 * rule). State is just `lastGapX`; randomness comes from an injectable RNG
 * (`() => number` in [0,1)), so runs are fully deterministic and unit-testable.
 * See GapPlanner.test.ts for the fairness contract.
 */
export class GapPlanner {
  private lastGapX = GAME_WIDTH / 2;

  constructor(private readonly rng: () => number = Math.random) {}

  reset(): void {
    this.lastGapX = GAME_WIDTH / 2;
  }

  /** Centre x of the most recently planned gap (the next plan clamps around it). */
  get lastCenter(): number {
    return this.lastGapX;
  }

  plan(snapshot: DifficultySnapshot): PlannedGap {
    const def = this.pickType(snapshot.weights);

    const gapWidth = clamp(
      snapshot.baseGap * def.gapFactor,
      OBSTACLE_CFG.gapMin * 0.66,
      GAME_WIDTH - OBSTACLE_CFG.edgePadding * 2
    );
    const band = OBSTACLE_CFG.bandHeight * def.bandFactor;

    const half = gapWidth / 2;
    const minX = OBSTACLE_CFG.edgePadding + half;
    const maxX = GAME_WIDTH - OBSTACLE_CFG.edgePadding - half;

    // Random gap centre (clamped below so it stays reachable from the previous one).
    const desired = minX + this.rng() * (maxX - minX);

    // Reachability clamp: limit how far the gap can shift from the previous one.
    const spacing = DifficultyManager.effectiveSpacing(snapshot.speed, snapshot.spacing);
    const travelTime = spacing / snapshot.speed; // ms for the next barrier to arrive
    const maxShift = PLAYER_CFG.moveSpeed * travelTime * OBSTACLE_CFG.reachFactor;
    let center = clamp(desired, this.lastGapX - maxShift, this.lastGapX + maxShift);
    center = clamp(center, minX, maxX);

    // Motion for the moving type (kept inside bounds & gentle enough to be fair).
    let amp = 0;
    let omega = 0;
    if (def.moving) {
      amp = Math.min(80, center - minX, maxX - center);
      omega = (2 * Math.PI) / 2400; // ~2.4s period
    }

    this.lastGapX = center;
    return { def, center, gapWidth, band, amp, omega };
  }

  private pickType(weights: Map<ObstacleType, number>): ObstacleTypeDef {
    let total = 0;
    weights.forEach((w) => (total += w));
    let r = this.rng() * total;
    for (const [type, w] of weights) {
      r -= w;
      if (r <= 0) return OBSTACLE_TYPES[type];
    }
    return OBSTACLE_TYPES[ObstacleType.Straight];
  }
}
