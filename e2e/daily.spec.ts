/**
 * E2E-DAI — Daily hub: auto-open, render, and streak claim
 *
 * The DailyManager uses `dodgerush.daily` (JSON) to track:
 *   { lastClaimDay, streak, missions }
 *
 * Tests seed the state so the Daily hub believes a streak reward is available
 * today, verify that the scene auto-opens from MainMenu (the retention hook),
 * and verify that claiming increases the coin balance.
 *
 * Date seeding: the game reads `new Date()` at runtime to determine "today".
 * We cannot freeze the clock in Phaser, so we construct a state where
 * `lastClaimDay` is yesterday — making `Daily.canClaimReward()` return true.
 */
import { test, expect } from '@playwright/test';
import {
  gotoWithState,
  waitForScene,
  startScene,
  readLS,
  tapGame,
  diagnosticErrors,
  LS,
} from './helpers';

/** Returns a YYYY-MM-DD string offset by `deltaDays` from today. */
function dayOffset(deltaDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + deltaDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Build a DailyState JSON where the streak reward can be claimed today. */
function claimableDailyState(streak = 2): string {
  return JSON.stringify({
    lastClaimDay: dayOffset(-1), // claimed yesterday → eligible again today
    streak,
    missions: null,
  });
}

/** Build a DailyState JSON where the reward was already claimed today. */
function alreadyClaimedDailyState(): string {
  return JSON.stringify({
    lastClaimDay: dayOffset(0), // claimed today → not eligible
    streak: 3,
    missions: null,
  });
}

test.describe('E2E-DAI — Daily hub', () => {
  // ----- Auto-open from MainMenu ----------------------------------------

  test('E2E-DAI-01: Daily hub auto-opens from MainMenu when streak is claimable', async ({ page }) => {
    await gotoWithState(page, {
      [LS.DAILY]: claimableDailyState(),
    });

    // Wait for MainMenu first; it auto-opens Daily after 420 ms when there is
    // an unclaimed reward. We wait up to 5 s for the Daily scene to become active.
    await waitForScene(page, 'MainMenu');
    await waitForScene(page, 'Daily', 5_000);

    const errors = await diagnosticErrors(page);
    expect(errors).toBe(0);
  });

  // ----- Daily does NOT auto-open when already claimed ------------------

  test('E2E-DAI-02: Daily hub does NOT auto-open when reward already claimed today', async ({ page }) => {
    await gotoWithState(page, {
      [LS.DAILY]: alreadyClaimedDailyState(),
    });
    await waitForScene(page, 'MainMenu');

    // Wait 1.5 s (well beyond the 420 ms trigger) and verify we're still on MainMenu.
    await page.waitForTimeout(1_500);

    const isDaily = await page.evaluate(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).game?.scene?.isActive('Daily') === true,
    );
    expect(isDaily, 'Daily must NOT auto-open when reward already claimed').toBe(false);
  });

  // ----- DailyScene renders without crash --------------------------------

  test('E2E-DAI-03: DailyScene renders without diagnostics errors', async ({ page }) => {
    await gotoWithState(page, { [LS.DAILY]: claimableDailyState() });
    await waitForScene(page, 'MainMenu');
    await startScene(page, 'Daily');
    await waitForScene(page, 'Daily');

    const errors = await diagnosticErrors(page);
    expect(errors).toBe(0);
  });

  // ----- Claiming streak reward -----------------------------------------

  test('E2E-DAI-04: claiming streak reward grants coins and marks claim in state', async ({ page }) => {
    const startCoins = 100;
    await gotoWithState(page, {
      [LS.COINS]: String(startCoins),
      [LS.DAILY]: claimableDailyState(1), // streak=1, reward = 25 coins (index 0)
    });
    await waitForScene(page, 'MainMenu');
    await startScene(page, 'Daily');
    await waitForScene(page, 'Daily');
    await page.waitForTimeout(300); // let the render settle

    // The "CLAIM" button for the streak reward is rendered near the centre of
    // the streak band. DailyScene.renderStreak() places it around (270, 280).
    await tapGame(page, 270, 280);
    await page.waitForTimeout(500); // DailyScene re-renders after claim

    const coinsRaw = await readLS(page, LS.COINS);
    const coinsAfter = parseInt(coinsRaw ?? String(startCoins), 10);
    expect(coinsAfter, 'coins must increase after claiming streak reward').toBeGreaterThan(startCoins);

    // The daily state must now record today as `lastClaimDay`.
    const dailyRaw = await readLS(page, LS.DAILY);
    const dailyState = JSON.parse(dailyRaw ?? '{}');
    expect(dailyState.lastClaimDay).toBe(dayOffset(0));
  });

  // ----- BACK button returns to MainMenu --------------------------------

  test('E2E-DAI-05: BACK button in DailyScene returns to MainMenu', async ({ page }) => {
    await gotoWithState(page);
    await waitForScene(page, 'MainMenu');
    await startScene(page, 'Daily');
    await waitForScene(page, 'Daily');

    // BACK button is at (270, 918) in game coords.
    await tapGame(page, 270, 918);
    await waitForScene(page, 'MainMenu', 8_000);
  });
});
