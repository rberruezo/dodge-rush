import { COMBO_TIERS, COMBO_CFG, ComboTier } from '../config/Constants';

export interface ComboState {
  count: number;
  multiplier: number;
  frame: number | null; // numbered combo sprite for this tier (null = none)
  fx: 'huge' | 'epic' | null; // milestone celebration intensity
  tierUp: boolean; // reached a new tier this pass
}

/**
 * Consecutive-pass combo. Higher combo → bigger score multiplier AND a faster
 * game. Tiers go x2/x3/x5/x10/x20, then milestone celebrations at 50, 100 and
 * every 100 after. Resets when a life is lost.
 */
export class ComboManager {
  private count = 0;
  private mult = 1;

  reset(): void {
    this.count = 0;
    this.mult = 1;
  }

  increment(): ComboState {
    this.count += 1;
    const prevMult = this.mult;
    const tier = this.tier();
    this.mult = tier ? tier.mult : 1;
    return {
      count: this.count,
      multiplier: this.mult,
      frame: tier?.frame ?? null,
      fx: tier?.fx ?? null,
      tierUp: this.mult > prevMult
    };
  }

  private tier(): ComboTier | null {
    for (const t of COMBO_TIERS) {
      if (this.count >= t.at) return t;
    }
    return null;
  }

  get combo(): number {
    return this.count;
  }

  get multiplier(): number {
    return this.mult;
  }

  /** Extra fall speed contributed by the current combo (0 at x1). */
  get speedBonus(): number {
    return Math.min(COMBO_CFG.speedBonusMax, (this.mult - 1) * COMBO_CFG.speedPerMult);
  }
}
