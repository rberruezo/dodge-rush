import { OBSTACLE_CFG, FORK_CFG, PLAYER_CFG, GAME_WIDTH } from '../config/Constants';
import { ObstacleType, ObstacleTypeDef, OBSTACLE_TYPES } from '../config/ObstacleTypes';
import { DifficultySnapshot, DifficultyManager } from './DifficultyManager';

/** A second, harder gap carved far to one side of the easy gap (GME-017 fork). */
export interface HardGap {
  center: number; // hard gap centre x
  width: number; // hard gap width (narrower than the easy gap)
}

export interface PlannedGap {
  def: ObstacleTypeDef;
  center: number; // easy gap centre x (the normal, reachable gap)
  gapWidth: number; // easy gap safe-passage width
  band: number; // wall band thickness
  amp: number; // horizontal oscillation amplitude (0 = static)
  omega: number; // oscillation angular speed
  fork?: HardGap; // optional risk↔reward second gap (GME-017)
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

    let gapWidth = clamp(
      snapshot.baseGap * def.gapFactor,
      OBSTACLE_CFG.gapMin * 0.66,
      GAME_WIDTH - OBSTACLE_CFG.edgePadding * 2
    );

    // Golden obstacles have a tighter gap (20% narrower) to add challenge — the
    // true reward is the boost, not the instant bonus. Center stays the same;
    // only reduce the height of the opening. Clamped to ensure it stays passable.
    if (def.golden) {
      gapWidth = clamp(
        gapWidth * OBSTACLE_CFG.goldenGapReduceFactor,
        OBSTACLE_CFG.gapMin * 0.66,
        GAME_WIDTH - OBSTACLE_CFG.edgePadding * 2
      );
    }

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

    // Risk↔reward fork (GME-017): sometimes carve a second, narrower gap far to
    // one side. The easy gap above stays the fair, reachable option; the fork is
    // the optional gamble. Forks are static (amp 0) so the choice reads clearly.
    const fork = this.maybeFork(def, snapshot, center, gapWidth);
    if (fork) return { def, center, gapWidth, band, amp: 0, omega: 0, fork };

    return { def, center, gapWidth, band, amp, omega };
  }

  /**
   * Decide whether this barrier becomes a fork and, if so, place the hard gap.
   * Returns the hard gap (far side, narrower) or null to keep a single gap.
   * The easy gap (passed in) is never moved, so the fairness contract holds.
   */
  private maybeFork(
    def: ObstacleTypeDef,
    snapshot: DifficultySnapshot,
    easyCenter: number,
    easyWidth: number
  ): HardGap | null {
    // Eligible only for static, non-reward walls, after the newcomer grace period,
    // and only when the normal gap is wide enough to be the comfortable easy side.
    if (def.moving || def.golden) return null;
    if (snapshot.level < FORK_CFG.minLevel) return null;
    if (easyWidth < FORK_CFG.minEasyGap) return null;
    if (this.rng() >= FORK_CFG.spawnChance) return null;

    const lo = OBSTACLE_CFG.edgePadding;
    const hi = GAME_WIDTH - OBSTACLE_CFG.edgePadding;
    const width = clamp(easyWidth * FORK_CFG.hardRatio, FORK_CFG.minHardGap, easyWidth - 24);
    const half = width / 2;
    const easyLeft = easyCenter - easyWidth / 2;
    const easyRight = easyCenter + easyWidth / 2;
    const need = width + FORK_CFG.minPillar + FORK_CFG.minOuterWall;
    const roomRight = hi - easyRight;
    const roomLeft = easyLeft - lo;

    // Place the hard gap as far as it fits on the roomier side (maximum commitment),
    // always leaving a visible outer wall and a min-width pillar from the easy gap.
    if (roomRight >= roomLeft && roomRight >= need) {
      return { center: hi - half - FORK_CFG.minOuterWall, width };
    }
    if (roomLeft >= need) {
      return { center: lo + half + FORK_CFG.minOuterWall, width };
    }
    if (roomRight >= need) {
      return { center: hi - half - FORK_CFG.minOuterWall, width };
    }
    return null;
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
