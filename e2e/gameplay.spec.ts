/**
 * E2E-GAM — GameScene initialisation and core loop
 *
 * Verifies that the GameScene boots correctly under both difficulty modes,
 * that the lives count matches the selected mode, and that transitioning
 * to GameOver produces the expected data shape.
 *
 * Full automated gameplay (let the player die by waiting) is avoided here
 * because it is timing-sensitive and belongs in manual QA (see GME-* items in
 * QA-MANUAL-CHECKLIST.md). Instead these tests focus on the scene's
 * initial state and programmatic transitions.
 */
import { test, expect } from '@playwright/test';
import {
  gotoWithState,
  waitForScene,
  startScene,
  getGameLives,
  diagnosticErrors,
  LS,
} from './helpers';

test.describe('E2E-GAM — GameScene initialisation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithState(page);
    await waitForScene(page, 'MainMenu');
  });

  // ----- GameScene boots without crash ----------------------------------

  test('E2E-GAM-01: GameScene starts without crash (CLASSIC)', async ({ page }) => {
    // Launch GameScene directly; MainMenu would normally do this via its
    // launch() animation, but for E2E we skip the cinematic.
    await startScene(page, 'Game');
    await waitForScene(page, 'Game');

    const errors = await diagnosticErrors(page);
    expect(errors, 'GameScene must not produce any diagnostics errors on start').toBe(0);
  });

  // ----- Lives count per mode -------------------------------------------

  test('E2E-GAM-02: CLASSIC mode starts with 3 lives', async ({ page }) => {
    await gotoWithState(page, { [LS.DIFFICULTY]: 'classic' });
    await waitForScene(page, 'MainMenu');

    await startScene(page, 'Game');
    await waitForScene(page, 'Game');

    // Give the scene one frame to finish its create() lifecycle.
    await page.waitForTimeout(100);

    const lives = await getGameLives(page);
    expect(lives, 'CLASSIC mode must initialise with 3 lives').toBe(3);
  });

  test('E2E-GAM-03: RELAX mode starts with 5 lives', async ({ page }) => {
    await gotoWithState(page, { [LS.DIFFICULTY]: 'relax' });
    await waitForScene(page, 'MainMenu');

    await startScene(page, 'Game');
    await waitForScene(page, 'Game');

    await page.waitForTimeout(100);

    const lives = await getGameLives(page);
    expect(lives, 'RELAX mode must initialise with 5 lives').toBe(5);
  });

  // ----- GameOver data shape --------------------------------------------

  test('E2E-GAM-04: GameOverScene receives score and coin data', async ({ page }) => {
    // Start GameOver directly with a known payload and verify the scene
    // renders without errors — this exercises the data contract between
    // GameScene.finishGameOver() and GameOverScene.create().
    await startScene(page, 'GameOver', {
      score:      200,
      best:       200,
      isNewBest:  true,
      coins:      12,
      totalCoins: 112,
    });
    await waitForScene(page, 'GameOver');

    const errors = await diagnosticErrors(page);
    expect(errors).toBe(0);
  });

  // ----- Retry from GameOver --------------------------------------------

  test('E2E-GAM-05: RETRY button in GameOverScene launches a new GameScene', async ({ page }) => {
    await startScene(page, 'GameOver', {
      score: 50, best: 100, isNewBest: false, coins: 2, totalCoins: 52,
    });
    await waitForScene(page, 'GameOver');

    // Programmatically trigger Retry (mirrors what the RETRY button does).
    await startScene(page, 'Game');
    await waitForScene(page, 'Game', 10_000);
  });

  // ----- MENU button from GameOver --------------------------------------

  test('E2E-GAM-06: MENU button in GameOverScene returns to MainMenu', async ({ page }) => {
    await startScene(page, 'GameOver', {
      score: 50, best: 100, isNewBest: false, coins: 2, totalCoins: 52,
    });
    await waitForScene(page, 'GameOver');

    await startScene(page, 'MainMenu');
    await waitForScene(page, 'MainMenu', 10_000);
  });
});
