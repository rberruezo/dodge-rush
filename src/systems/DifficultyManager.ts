import {
  SCROLL_CFG,
  OBSTACLE_CFG,
  DIFFICULTY_CFG,
  DIFFICULTY_MODES,
  DEFAULT_DIFFICULTY,
  DifficultyMode,
  DifficultyModeId,
  STORAGE_KEYS
} from '../config/Constants';
import { ObstacleType, ObstacleTypeDef, ALL_OBSTACLE_TYPES } from '../config/ObstacleTypes';
import { Diagnostics } from './Diagnostics';

export interface DifficultySnapshot {
  level: number; // integer step (every 30s)
  speed: number; // fall speed px/ms
  spacing: number; // vertical distance between barriers (px)
  baseGap: number; // base passage width (px) before per-type factors
  weights: Map<ObstacleType, number>; // spawn weights for this moment
}

/**
 * Turns "time survived" into a smoothly-ramping difficulty.
 *
 * Per the design: every 30s fall speed rises, obstacles get more frequent, the
 * average gap shrinks, and the spawn mix shifts toward harder types (moving,
 * danger, diagonal). Values interpolate continuously so there are no spikes.
 */
export class DifficultyManager {
  /** Active difficulty mode (CLASSIC by default). Persisted via setMode(). */
  private static mode_: DifficultyMode = DIFFICULTY_MODES[DifficultyManager.loadModeId()];

  /** The active mode's config (read by GameScene for lives + combo speed). */
  static get mode(): DifficultyMode {
    return DifficultyManager.mode_;
  }

  /** Switch + persist the difficulty mode. */
  static setMode(id: DifficultyModeId): void {
    this.mode_ = DIFFICULTY_MODES[id] ?? DIFFICULTY_MODES[DEFAULT_DIFFICULTY];
    try {
      localStorage.setItem(STORAGE_KEYS.DIFFICULTY, this.mode_.id);
    } catch (e) {
      Diagnostics.warn('storage', 'difficulty save failed', e); // private mode, etc.
    }
  }

  private static loadModeId(): DifficultyModeId {
    try {
      const id = localStorage.getItem(STORAGE_KEYS.DIFFICULTY) as DifficultyModeId | null;
      if (id && id in DIFFICULTY_MODES) return id;
    } catch (e) {
      Diagnostics.warn('storage', 'difficulty read failed', e);
    }
    return DEFAULT_DIFFICULTY;
  }

  /** Compute every difficulty parameter for a given elapsed time (seconds). */
  static sample(elapsedSeconds: number): DifficultySnapshot {
    const m = DifficultyManager.mode_;
    // RELAX slows the clock that drives every ramp, so it stays gentle longer.
    const t = elapsedSeconds * m.rampScale;

    const level = Math.min(
      m.maxStep,
      Math.floor(elapsedSeconds / DIFFICULTY_CFG.stepSeconds)
    );

    // Continuous ramps (not stepped) for smoothness; scaled per difficulty mode.
    const speed = Math.min(
      SCROLL_CFG.maxSpeed * m.speedScale,
      (SCROLL_CFG.startSpeed + SCROLL_CFG.accelPerSec * t) * m.speedScale
    );
    const spacing = Math.max(
      OBSTACLE_CFG.spacingMin,
      OBSTACLE_CFG.spacingStart - OBSTACLE_CFG.spacingShrinkPerSec * t
    ) * m.spacingScale;
    const baseGap = Math.max(
      OBSTACLE_CFG.gapMin,
      OBSTACLE_CFG.gapStart - OBSTACLE_CFG.gapShrinkPerSec * t
    ) * m.gapScale;

    return { level, speed, spacing, baseGap, weights: DifficultyManager.weights(level) };
  }

  /**
   * Enforce the fairness floor: barriers must be far enough apart (relative to
   * the current speed) to guarantee the minimum reaction window.
   */
  static effectiveSpacing(speed: number, spacing: number): number {
    return Math.max(spacing, speed * OBSTACLE_CFG.reactionMinMs);
  }

  private static weights(level: number): Map<ObstacleType, number> {
    const map = new Map<ObstacleType, number>();
    for (const def of ALL_OBSTACLE_TYPES) {
      map.set(def.type, Math.max(0.5, DifficultyManager.weightFor(def, level)));
    }
    return map;
  }

  private static weightFor(def: ObstacleTypeDef, level: number): number {
    const w = def.baseWeight;
    switch (def.type) {
      case ObstacleType.Straight:
        return w - 3 * level; // fewer freebies over time
      case ObstacleType.Wide:
        return w - 0.5 * level;
      case ObstacleType.Moving:
        return w + 2 * level; // more dynamic threats
      case ObstacleType.Danger:
        return w + 1.5 * level;
      case ObstacleType.Narrow:
        return w + 1 * level;
      default:
        return w; // broken / glowing / golden stay rare & constant
    }
  }
}
