# MVP Minimal Implementation Brief — For Standalone LLM Agent

> **Target:** Another Claude instance running independently
> **Project:** Dodge Rush (Phaser.js arcade casual game)
> **Task:** Implement MVP Minimal (feature flags + UI simplification)
> **Repository:** `/Users/rama/Workspace/ai-web-app/`
> **Timeline:** Self-paced. Commit after each major milestone.

---

## Executive Summary

You are implementing a **feature flag system** to simplify Dodge Rush for MVP v1.0 launch. The game currently has 5 complex features. You will:

1. **Create feature flags** (one boolean per feature)
2. **Hide UI elements** in MainMenuScene, GameOverScene, and HUD
3. **Comment/disable** feature-specific logic in-code
4. **Verify no regressions** (game still launches and plays)

All features remain in code — they're just toggled off. Reverting takes 5 minutes (flip 5 booleans).

**Commit strategy:** Each milestone = 1 commit (feature flag creation, UI hide, logic disable, verification).

---

## Pre-Implementation Checklist

Before you start:

- [ ] You have read `/Users/rama/Workspace/ai-web-app/dodge-rush/docs/mvp-minimal-proposal.md`
- [ ] You understand the 5 features being toggled: SHOP, DAILY, COMBO_LABELS, MONETIZATION, RELAX_MODE
- [ ] You know the project structure: `src/scenes/`, `src/systems/`, `src/config/`
- [ ] You have git access and can commit with author "Claude LLM Agent <noreply@anthropic.com>"
- [ ] You can run `npm run dev` to verify changes locally

If any of the above is unclear, stop and ask for clarification.

---

## Feature Flags System (Step 0)

### Create: `src/config/FeatureFlags.ts`

```typescript
/**
 * Feature flags for MVP v1.0 → v1.1 rollout.
 * Set to false to disable features in UI/gameplay.
 * All code remains intact — these are toggles only.
 */

export const FEATURES = {
  // V1.0 DISABLED
  SHOP_ENABLED: false,           // Shop UI, skin purchasing, coin economy
  DAILY_ENABLED: false,          // Daily missions, login streak, mission UI
  COMBO_LABELS_ENABLED: false,   // Fancy combo names (TORMETA, ÓRBITA, etc)
  MONETIZATION_ENABLED: false,   // Coins, rewards, ruleta spin, double coins
  RELAX_MODE_ENABLED: false,     // RELAX difficulty mode, mode picker

  // V1.0 ENABLED (do not touch)
  CORE_LOOP_ENABLED: true,       // Gameplay, scoring, combo, lives
  ACHIEVEMENTS_ENABLED: false,   // (Future) Achievement skins, unlocks
  LEADERBOARD_ENABLED: false,    // (Future) Friends/global ranking
};

// Type-safe helper (optional, but recommended)
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}
```

**Commit:** `feat: add feature flags system for MVP v1.0 simplification`

---

## Step 1: Hide Shop UI

### File: `src/scenes/MainMenuScene.ts`

**Find the section where buttons are created.** Likely around line 50–100, something like:

```typescript
const shopButton = this.add.text(/* ... */).setInteractive();
const dailyButton = this.add.text(/* ... */).setInteractive();
```

**Change to:**

```typescript
import { FEATURES } from '../config/FeatureFlags';

// In create() method, after defining buttons:
if (!FEATURES.SHOP_ENABLED) {
  shopButton.setVisible(false);
  shopButton.setInteractive(false);
}
if (!FEATURES.DAILY_ENABLED) {
  dailyButton.setVisible(false);
  dailyButton.setInteractive(false);
}
```

**Verify:** Run `npm run dev`, navigate to MainMenuScene. SHOP and DAILY buttons should be invisible/unclickable. PLAY and INFO buttons remain.

**Commit:** `feat(UI): hide SHOP and DAILY buttons when feature flags disabled`

---

## Step 2: Simplify GameOverScene

### File: `src/scenes/GameOverScene.ts`

**Find the section that renders:**
- Coins display
- "DOUBLE COINS" button
- "SPIN WHEEL" button
- Rewards UI

**Pattern to use:**

```typescript
import { FEATURES } from '../config/FeatureFlags';

// In create() method:

// Coins display (remove or hide)
if (FEATURES.MONETIZATION_ENABLED) {
  const coinsLabel = this.add.text(/* ... coins ... */);
} // else: no coins display

// DOUBLE COINS button (remove or hide)
if (FEATURES.MONETIZATION_ENABLED) {
  const doubleCoinBtn = this.add.text(/* ... "DOUBLE COINS" ... */);
}

// SPIN WHEEL button (remove or hide)
if (FEATURES.MONETIZATION_ENABLED) {
  const spinBtn = this.add.text(/* ... "SPIN WHEEL" ... */);
}

// Keep: Score, Best, Tap to Retry
const scoreText = this.add.text(/* ... show score ... */); // ALWAYS SHOW
const bestText = this.add.text(/* ... show best ... */);   // ALWAYS SHOW
```

**Result:** GameOverScene shows only `Score` + `Best` + `[TAP TO RETRY]`. No coins, no buttons, no rewards.

**Verify:** End a game, check GameOverScene. Only score/best visible. No coin references.

**Commit:** `feat(UI): remove monetization UI from GameOverScene`

---

## Step 3: Simplify HUD

### File: `src/ui/HUD.ts`

**Find the section that renders combo label.** Likely:

```typescript
const comboLabel = `COMBO x${mult} (${tierName})!`;  // e.g., "COMBO x12 (TORMETA)!"
```

**Change to:**

```typescript
import { FEATURES } from '../config/FeatureFlags';

const comboLabel = FEATURES.COMBO_LABELS_ENABLED
  ? `COMBO x${mult} (${tierName})!`
  : `COMBO x${mult}!`;
```

**Verify:** Play a game, reach a combo milestone (x5, x10, x20). Popup should show "COMBO x12!" without "(TORMETA)".

**Commit:** `feat(UI): disable combo fancy labels in HUD`

---

## Step 4: Hide RELAX Mode Picker

### File: `src/systems/DifficultyManager.ts`

**Find the section that switches modes.** Likely a `switchMode()` function or mode picker logic.

**Add guard:**

```typescript
import { FEATURES } from '../config/FeatureFlags';

public static switchMode(): void {
  if (!FEATURES.RELAX_MODE_ENABLED) {
    console.warn('[DifficultyManager] Mode switching disabled in MVP v1.0');
    return; // Do nothing
  }
  // ... existing mode switch logic ...
}
```

**Also:** Find any UI button/UI element that triggers mode switch. Hide it:

```typescript
if (FEATURES.RELAX_MODE_ENABLED) {
  const modeButton = this.add.text(/* ... mode picker ... */);
} // else: no mode button
```

**Verify:** Look for mode picker in any menu. Should not exist in V1.0. Difficulty is always CLASSIC.

**Commit:** `feat(config): disable RELAX mode in MVP v1.0`

---

## Step 5: Disable Daily Missions Logic

### File: `src/systems/DailyManager.ts`

**Find the `reportRun()` method** that logs mission progress. Wrap it:

```typescript
import { FEATURES } from '../config/FeatureFlags';

public reportRun(data: { passes: number; combo: number; score: number }): void {
  if (!FEATURES.DAILY_ENABLED) {
    return; // Skip mission logic entirely
  }
  // ... existing daily logic ...
}
```

**Also find `hasUnclaimed()` in GameScene.** It checks for completed missions. Modify:

```typescript
const missionDone = FEATURES.DAILY_ENABLED && Daily.hasUnclaimed();
// In GameOverScene, don't show mission complete banner if flag is false
```

**Verify:** Play → end game → no "Mission complete!" feedback. Game Over screen clean.

**Commit:** `feat(systems): disable daily missions when flag is off`

---

## Step 6: Disable Monetization Logic

### File: `src/systems/Rewarded.ts`

**Find the spin/ruleta logic.** Likely in a function like `showSpin()` or `requestReward()`.

```typescript
import { FEATURES } from '../config/FeatureFlags';

public showSpin(): void {
  if (!FEATURES.MONETIZATION_ENABLED) {
    console.log('[Rewarded] Monetization disabled in MVP v1.0');
    return; // No spin shown
  }
  // ... existing spin logic ...
}
```

**Also in GameOverScene:** The button click that triggers spin should check:

```typescript
spinButton.on('pointerdown', () => {
  if (FEATURES.MONETIZATION_ENABLED) {
    Rewarded.showSpin();
  }
  // If disabled, button is already hidden (Step 2)
});
```

**Verify:** No coins gained post-run. No spin animation. Profile.coins stays at 0.

**Commit:** `feat(systems): disable monetization when flag is off`

---

## Step 7: Verify No Regressions

**Run the game end-to-end:**

```bash
cd /Users/rama/Workspace/ai-web-app/dodge-rush
npm run dev
```

**Checklist:**

- [ ] MainMenuScene loads: PLAY and INFO buttons visible, SHOP and DAILY hidden
- [ ] Click PLAY → GameScene starts immediately
- [ ] Reach combo x5 → popup shows "COMBO x5!" (no "(TORMETA)")
- [ ] Play ~30 seconds → obstacles appear, score increases
- [ ] Hit obstacle 3 times → lives go 3 → 2 → 1 → 0 → GameOver
- [ ] GameOverScene shows: Score + Best + [TAP TO RETRY] (no coins, no buttons)
- [ ] Tap screen → new game starts (no spinner, no ads)
- [ ] Check browser console: no errors, no warnings (except expected FeatureFlags logs)
- [ ] Profile.coins = 0 (no monetization)
- [ ] DifficultyManager.mode = CLASSIC (no RELAX switching)

**If all pass:** Game is functional and simplified. No broken UI, no crashes.

**Commit:** `test: verify MVP v1.0 end-to-end (no regressions)`

---

## Step 8: Update Documentation

### File: `src/config/FeatureFlags.ts` (add docstring)

Add inline comments to explain when each flag will be enabled:

```typescript
export const FEATURES = {
  SHOP_ENABLED: false,           // [V1.1] Re-enable with skin shop UI
  DAILY_ENABLED: false,          // [V1.1] Re-enable with daily mission hub
  COMBO_LABELS_ENABLED: false,   // [V1.1] Re-enable with combo name system
  MONETIZATION_ENABLED: false,   // [V1.1] Re-enable with AdMob + ruleta
  RELAX_MODE_ENABLED: false,     // [V1.1] Re-enable with difficulty picker
  // ...
};
```

### Also: Update `docs/mvp-minimal-proposal.md`

Add a section: "Implementation Status" with checkboxes for each step.

**Commit:** `docs: document feature flag status and reactivation timeline`

---

## Step 9: Summary Commit

After all steps are done, create a **summary commit** that ties everything together:

```
feat: implement MVP Minimal v1.0 (apaga 5 features, simplifica UI)

Changes:
- Feature flags system (src/config/FeatureFlags.ts)
- Hidden SHOP, DAILY buttons in MainMenuScene
- Removed monetization UI from GameOverScene
- Disabled combo fancy labels in HUD
- Disabled RELAX mode in DifficultyManager
- Disabled daily missions logic in DailyManager
- Disabled rewarded ads/spin in Rewarded.ts
- End-to-end verification: no regressions

All features remain in code. Reverting: flip 5 booleans in FeatureFlags.ts.

Closes DIS-002 (backlog).

Co-Authored-By: Mobile Game Designer <ramiro.berruezo@valtech.com>
```

---

## Git Commit History (Expected)

After all steps, your git log should look like:

```
feat: implement MVP Minimal v1.0 (apaga 5 features, simplifica UI)
docs: document feature flag status and reactivation timeline
test: verify MVP v1.0 end-to-end (no regressions)
feat(systems): disable monetization when flag is off
feat(systems): disable daily missions when flag is off
feat(config): disable RELAX mode in MVP v1.0
feat(UI): disable combo fancy labels in HUD
feat(UI): remove monetization UI from GameOverScene
feat(UI): hide SHOP and DAILY buttons when feature flags disabled
feat: add feature flags system for MVP v1.0 simplification
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "Cannot find FeatureFlags module" | Make sure you created `src/config/FeatureFlags.ts` FIRST (Step 0) |
| "Buttons still visible even with setVisible(false)" | Check `setInteractive(false)` is also called. Also verify you're in the correct scene file. |
| "Game crashes when I disable monetization" | Likely a `null` reference. Wrap the entire reward flow, not just one function. |
| "Combo labels still show" | Make sure HUD.ts is reading the flag at **render time**, not at **config time**. |
| "Tests fail" | Tests are separate. You may need to update test expectations or mock the flags. Focus on manual verification. |

---

## Success Criteria

You're done when:

- ✅ All 9 steps completed and committed
- ✅ Game launches and plays without errors
- ✅ UI shows: MainMenu (PLAY, INFO only), HUD (no labels), GameOver (score/best only)
- ✅ No coins, no missions, no fancy combo names, no ads
- ✅ Difficulty always CLASSIC
- ✅ All commits pushed to remote
- ✅ Backlog item DIS-002 marked DONE

---

## Questions?

If stuck on any step:

1. Check the file paths — they're absolute, all within `/Users/rama/Workspace/ai-web-app/dodge-rush/`
2. Read the existing code around the area you're modifying — patterns will be clear
3. Test locally with `npm run dev` — if the change works, it's good
4. Commit early and often — each step is a logical unit

Good luck. This is straightforward code — flag checks + UI hide/show. You've got this.
