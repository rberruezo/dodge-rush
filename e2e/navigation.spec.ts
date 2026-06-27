/**
 * E2E-NAV — Scene navigation
 *
 * Verifies that all scene transitions reachable from the main menu work
 * without crashes. Scene changes are driven programmatically via
 * `window.game.scene.start()` rather than canvas-click simulation so the
 * tests are fast and coordinate-independent.
 *
 * Each test boots fresh to the main menu, then navigates and asserts.
 */
import { test, expect } from '@playwright/test';
import {
  gotoWithState,
  waitForScene,
  startScene,
  diagnosticErrors,
} from './helpers';

test.describe('E2E-NAV — Scene navigation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithState(page);
    await waitForScene(page, 'MainMenu');
  });

  // ----- MainMenu → Shop ------------------------------------------------

  test('E2E-NAV-01: MainMenu → ShopScene (no crash)', async ({ page }) => {
    await startScene(page, 'Shop');
    await waitForScene(page, 'Shop');

    const errors = await diagnosticErrors(page);
    expect(errors, 'ShopScene must not log any diagnostics errors').toBe(0);
  });

  // ----- Shop → MainMenu ------------------------------------------------

  test('E2E-NAV-02: Shop → MainMenuScene (back navigation)', async ({ page }) => {
    await startScene(page, 'Shop');
    await waitForScene(page, 'Shop');

    await startScene(page, 'MainMenu');
    await waitForScene(page, 'MainMenu');
  });

  // ----- MainMenu → Info ------------------------------------------------

  test('E2E-NAV-03: MainMenu → InfoScene (how-to-play)', async ({ page }) => {
    await startScene(page, 'Info');
    await waitForScene(page, 'Info');

    const errors = await diagnosticErrors(page);
    expect(errors).toBe(0);
  });

  // ----- MainMenu → Daily -----------------------------------------------

  test('E2E-NAV-04: MainMenu → DailyScene', async ({ page }) => {
    await startScene(page, 'Daily');
    await waitForScene(page, 'Daily');

    const errors = await diagnosticErrors(page);
    expect(errors).toBe(0);
  });

  // ----- GameOver launched directly with data ---------------------------

  test('E2E-NAV-05: GameOverScene renders correctly with injected data', async ({ page }) => {
    await startScene(page, 'GameOver', {
      score: 312,
      best: 500,
      isNewBest: false,
      coins: 8,
      totalCoins: 108,
    });
    await waitForScene(page, 'GameOver');

    const errors = await diagnosticErrors(page);
    expect(errors).toBe(0);
  });

  // ----- GameOver "new best" branch ------------------------------------

  test('E2E-NAV-06: GameOverScene renders NEW BEST branch without crash', async ({ page }) => {
    await startScene(page, 'GameOver', {
      score: 1024,
      best: 1024,
      isNewBest: true,
      coins: 22,
      totalCoins: 222,
    });
    await waitForScene(page, 'GameOver');

    const errors = await diagnosticErrors(page);
    expect(errors).toBe(0);
  });
});
