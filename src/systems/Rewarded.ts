/**
 * Rewarded-ad seam.
 *
 * This is the single integration point for opt-in rewarded video. Today it is a
 * STUB that simulates a successful ad watch, so the player-friendly hooks
 * (revive, double-coins) are fully wired and testable without an ad network.
 *
 * Phase 4 (monetization) replaces `show()` with a real provider. For the kids /
 * families target this MUST be a Google Play Families–certified SDK serving
 * NON-personalized ads only, with the format/placement restrictions that policy
 * requires — verify against the official Google Play Families policy before
 * shipping. The rest of the game never needs to change: it only awaits a boolean
 * "was the reward earned?".
 */
export type RewardPlacement = 'continue' | 'double_coins';

class RewardedService {
  /** Simulated until a real network is wired in Phase 4. */
  readonly simulated = true;

  /** Whether a rewarded ad could be shown for this placement right now. */
  isAvailable(_placement: RewardPlacement): boolean {
    // Stub: always available. Real impl: reflect the SDK's loaded/ready state.
    return true;
  }

  /**
   * Show a rewarded ad for `placement`. Resolves true if the reward was earned
   * (ad watched to completion), false if it was skipped / failed / unavailable.
   * Callers MUST only grant the reward when this resolves true.
   */
  show(_placement: RewardPlacement): Promise<boolean> {
    // STUB: pretend the player watched a short ad and earned the reward.
    // Real impl: load (if needed) + present the rewarded ad, resolve on its
    // earned-reward / closed callbacks.
    return new Promise((resolve) => {
      window.setTimeout(() => resolve(true), 650);
    });
  }
}

export const Rewarded = new RewardedService();
