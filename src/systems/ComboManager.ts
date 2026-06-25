import { COMBO_CFG } from '../config/Constants';

export interface ComboState {
  count: number;
  multiplier: number;
  frame: number | null; // player sprite for the current tier (null = use fly anim)
  tierUp: boolean; // true the moment a new multiplier tier is reached
}

/**
 * Consecutive-pass combo. Higher combo → bigger score multiplier AND a faster
 * game (speed bonus). Tiers map to the on-sprite numbers (x2/x3/x5/x10/x20).
 * Losing a life resets it (combo only breaks on a crash in this game).
 */
export class ComboManager {
  private count = 0;
  private mult = 1;

  reset(): void {
    this.count = 0;
    this.mult = 1;
  }

  /** Register a cleared obstacle; returns the new combo state (incl. tier-up). */
  increment(): ComboState {
    this.count += 1;
    const prevMult = this.mult;
    this.mult = this.computeMultiplier();
    return {
      count: this.count,
      multiplier: this.mult,
      frame: this.frame,
      tierUp: this.mult > prevMult
    };
  }

  private computeMultiplier(): number {
    for (const tier of COMBO_CFG.tiers) {
      if (this.count >= tier.at) return tier.mult;
    }
    return 1;
  }

  get combo(): number {
    return this.count;
  }

  get multiplier(): number {
    return this.mult;
  }

  /** Player sprite frame for the current tier, or null below the first tier. */
  get frame(): number | null {
    for (const tier of COMBO_CFG.tiers) {
      if (this.count >= tier.at) return tier.frame;
    }
    return null;
  }

  /** Extra fall speed contributed by the current combo (0 at x1). */
  get speedBonus(): number {
    return Math.min(COMBO_CFG.speedBonusMax, (this.mult - 1) * COMBO_CFG.speedPerMult);
  }
}
