/**
 * Feature flags for MVP v1.0 → v1.1 rollout.
 * Set to false to disable features in UI/gameplay.
 * All code remains intact — these are toggles only.
 * Reverting: flip the booleans back to true.
 *
 * Mutable by design so unit tests can force-enable a flag to exercise the
 * underlying system (e.g. per-mode high scores) that the flag gates in the UI.
 */

export const FEATURES = {
  // V1.0 DISABLED
  SHOP_ENABLED: false,            // [V1.1] Re-enable with skin shop UI
  DAILY_ENABLED: false,           // [V1.1] Re-enable with daily mission hub
  COMBO_LABELS_ENABLED: false,    // [V1.1] Re-enable zone milestone banners (¡Las Nubes!, ¡Tormenta!, etc.)
  MONETIZATION_ENABLED: false,    // [V1.1] Re-enable with AdMob + ruleta spin + coin economy
  RELAX_MODE_ENABLED: false,      // [V1.1] Re-enable difficulty picker (RELAX / CLASSIC toggle)

  // V1.0 ENABLED (do not touch)
  CORE_LOOP_ENABLED: true,        // Gameplay, scoring, combo, lives
  ACHIEVEMENTS_ENABLED: false,    // [Future] Achievement skins, unlocks
  LEADERBOARD_ENABLED: false,     // [Future] Friends/global ranking
};

// Type-safe helper
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}
