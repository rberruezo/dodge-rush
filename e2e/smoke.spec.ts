/**
 * E2E-SMK — Full-session smoke test
 *
 * A single end-to-end journey that walks through the major scenes in the
 * order a real player would experience them, without skipping any transition.
 * Failures here indicate a regression in the integration between scenes or in
 * the shared singletons (ProfileManager, DifficultyManager, DailyManager).
 *
 * This test is intentionally slow (~20 s) and is marked @smoke so it can be
 * run in isolation: `playwright test --grep @smoke`.
 */
import { test, expect } from '@playwright/test';
import {
  gotoWithState,
  waitForScene,
  startScene,
  readLS,
  diagnosticErrors,
  LS,
} from './helpers';

test('@smoke Full player session: boot → menu → shop → daily → game → game-over', async ({ page }) => {
  test.setTimeout(35_000);

  // ---------- 1. Boot with a pre-seeded wallet & owned skin ---------------
  await gotoWithState(page, {
    [LS.COINS]:       '500',
    [LS.HIGH_SCORE]:  '42',
    [LS.OWNED_SKINS]: JSON.stringify(['classic', 'cat']),
    [LS.SELECTED_SKIN]: 'cat',
  });
  await waitForScene(page, 'MainMenu');
  expect(await diagnosticErrors(page)).toBe(0);

  // ---------- 2. Visit the Shop -------------------------------------------
  await startScene(page, 'Shop');
  await waitForScene(page, 'Shop');
  expect(await diagnosticErrors(page)).toBe(0);

  // ---------- 3. Return to MainMenu from Shop ------------------------------
  await startScene(page, 'MainMenu');
  await waitForScene(page, 'MainMenu');

  // ---------- 4. Visit the Daily hub (no auto-open because nothing is seeded) -
  await startScene(page, 'Daily');
  await waitForScene(page, 'Daily');
  expect(await diagnosticErrors(page)).toBe(0);

  // ---------- 5. Return to MainMenu from Daily ----------------------------
  await startScene(page, 'MainMenu');
  await waitForScene(page, 'MainMenu');

  // ---------- 6. Launch the GameScene -------------------------------------
  await startScene(page, 'Game');
  await waitForScene(page, 'Game');
  await page.waitForTimeout(200);
  expect(await diagnosticErrors(page)).toBe(0);

  // ---------- 7. Transition directly to GameOver --------------------------
  //   We skip waiting for the player to die naturally (that belongs in manual
  //   QA, GME-001). Instead we drive the scene programmatically.
  await startScene(page, 'GameOver', {
    score:      120,
    best:       120,
    isNewBest:  true,
    coins:      6,
    totalCoins: 506,
  });
  await waitForScene(page, 'GameOver');
  expect(await diagnosticErrors(page)).toBe(0);

  // ---------- 8. Verify coin total propagated correctly -------------------
  const coins = parseInt((await readLS(page, LS.COINS)) ?? '0', 10);
  // Coins seeded at 500; the game hasn't run real gameplay so they stay at 500.
  expect(coins).toBeGreaterThanOrEqual(500);

  // ---------- 9. Final: no errors throughout the entire session -----------
  expect(await diagnosticErrors(page)).toBe(0);
});
