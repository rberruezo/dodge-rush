/**
 * Spin (rewarded-ad roulette) logic.
 *
 * One spin per session (in-memory, resets on app open). Hard daily missions
 * grant a bonus spin tracked in DailyManager. The draw always picks from
 * UNOWNED skins — no repeats, no "consolation 50 coins" for bad luck
 * (GME-GD-001). If everything is owned, the spin gives CONSOLATION_COINS.
 *
 * Tier weights from docs/progression-skins.md.
 */

import { SKINS, type SkinDef, type SkinTier } from '../config/Skins';
import { Profile } from './ProfileManager';

export const SPIN_CONSOLATION_COINS = 50;

const TIER_WEIGHT: Record<SkinTier, number> = {
  free:       0,
  common:    40,
  rare:      35,
  epic:      18,
  legendary:  7,
};

export type SpinResult =
  | { kind: 'skin'; skin: SkinDef }
  | { kind: 'coins'; amount: number };

class SpinManagerImpl {
  /** True once the session spin has been used (resets every app open). */
  private sessionUsed = false;

  /** Bonus spins earned from hard daily missions (in-memory per session). */
  private bonusCount = 0;

  canSpin(): boolean {
    return !this.sessionUsed || this.bonusCount > 0;
  }

  /** Called by DailyManager when a hard mission spin reward is claimed. */
  addBonus(): void {
    this.bonusCount += 1;
  }

  /**
   * Draw a random unowned skin, weighted by tier. If all skins are owned,
   * returns consolation coins instead. Marks the appropriate spin as used.
   */
  draw(isFreeFirstRun = false): SpinResult {
    if (!isFreeFirstRun) {
      if (this.bonusCount > 0) {
        this.bonusCount -= 1;
      } else {
        this.sessionUsed = true;
      }
    }

    const pool = SKINS.filter((s) => s.tier !== 'free' && !Profile.isOwned(s.id));
    if (pool.length === 0) return { kind: 'coins', amount: SPIN_CONSOLATION_COINS };

    // Count skins per tier to spread weight evenly within each tier.
    const countPerTier: Partial<Record<SkinTier, number>> = {};
    for (const s of pool) countPerTier[s.tier] = (countPerTier[s.tier] ?? 0) + 1;

    // Build weighted entries; redistribute weight of empty tiers automatically
    // because missing tiers simply have 0 skins and contribute 0 total weight.
    const entries: { skin: SkinDef; w: number }[] = pool.map((s) => ({
      skin: s,
      w: TIER_WEIGHT[s.tier] / (countPerTier[s.tier] ?? 1),
    }));
    const total = entries.reduce((sum, e) => sum + e.w, 0);

    let r = Math.random() * total;
    for (const e of entries) {
      r -= e.w;
      if (r <= 0) return { kind: 'skin', skin: e.skin };
    }
    return { kind: 'skin', skin: entries[entries.length - 1].skin };
  }
}

export const Spin = new SpinManagerImpl();
