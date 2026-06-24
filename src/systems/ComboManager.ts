import { COMBO_CFG } from '../config/Constants';

/**
 * Tracks the consecutive-pass combo and its score multiplier.
 * x2 at 5 passes, x3 at 10, x5 at 20 (from the design). Colliding ends the run,
 * which resets the combo for the next one.
 */
export class ComboManager {
  private count = 0;

  reset(): void {
    this.count = 0;
  }

  /** Register a successful pass; returns the new combo count. */
  increment(): number {
    this.count += 1;
    return this.count;
  }

  get combo(): number {
    return this.count;
  }

  /** Current score multiplier for the active combo. */
  get multiplier(): number {
    for (const tier of COMBO_CFG.tiers) {
      if (this.count >= tier.at) return tier.mult;
    }
    return 1;
  }
}
