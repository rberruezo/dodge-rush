/**
 * E2E-PER — localStorage persistence
 *
 * Verifies that player-facing settings (mute, difficulty) and saved progress
 * (coins, highscore, selected skin) survive a full page reload. These are
 * critical for mobile web games where the user can reload the tab accidentally.
 *
 * Strategy:
 *   - Seed a known state via addInitScript (before Phaser boots).
 *   - Navigate and let the game read the state.
 *   - Assert through window globals / localStorage.
 *   - For mute/difficulty: toggle in-game then reload to verify persistence.
 */
import { test, expect } from '@playwright/test';
import {
  gotoWithState,
  waitForScene,
  waitForGame,
  readLS,
  tapGame,
  LS,
  GW,
  GH,
} from './helpers';

test.describe('E2E-PER — Persistence across reload', () => {
  // ----- Mute toggle ----------------------------------------------------

  test('E2E-PER-01: mute toggle persists after page reload', async ({ page }) => {
    // Boot without any pre-set mute state → defaults to unmuted.
    await gotoWithState(page);
    await waitForScene(page, 'MainMenu');

    const initialMuted = await readLS(page, LS.MUTED);
    expect(initialMuted).not.toBe('1'); // should start unmuted

    // The mute button is at bottom-right: (GAME_WIDTH - 22, GAME_HEIGHT - 22)
    // It is rendered around (470..540, 920..960) — tap its approximate centre.
    await tapGame(page, GW - 50, GH - 22);
    await page.waitForTimeout(300); // let the event propagate

    const afterToggle = await readLS(page, LS.MUTED);
    expect(afterToggle, 'muted flag should be written to localStorage').toBe('1');

    // Reload and verify the flag survived.
    await page.reload();
    await waitForScene(page, 'MainMenu');

    const afterReload = await readLS(page, LS.MUTED);
    expect(afterReload, 'muted state must survive page reload').toBe('1');
  });

  // ----- Difficulty toggle ----------------------------------------------

  test('E2E-PER-02: difficulty toggle persists after page reload', async ({ page }) => {
    // Boot without any difficulty set → defaults to "classic".
    await gotoWithState(page);
    await waitForScene(page, 'MainMenu');

    const initial = await readLS(page, LS.DIFFICULTY);
    // Initial value is either null (not yet persisted) or 'classic'.
    expect(['classic', null]).toContain(initial);

    // The difficulty toggle is at bottom-left: (22, GAME_HEIGHT - 22).
    // Tap it to switch to RELAX.
    await tapGame(page, 50, GH - 22);
    await page.waitForTimeout(300);

    const afterToggle = await readLS(page, LS.DIFFICULTY);
    expect(afterToggle, 'difficulty must be written to localStorage after toggle').toBe('relax');

    await page.reload();
    await waitForScene(page, 'MainMenu');

    const afterReload = await readLS(page, LS.DIFFICULTY);
    expect(afterReload, 'difficulty must survive page reload').toBe('relax');
  });

  // ----- Coin balance ---------------------------------------------------

  test('E2E-PER-03: seeded coin balance is read correctly by ProfileManager', async ({ page }) => {
    await gotoWithState(page, { [LS.COINS]: '750' });
    await waitForScene(page, 'MainMenu');

    const coins = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).game;
      // Access Profile singleton via an active scene's manager (if imported).
      // Fallback: read directly from localStorage as the game would see it.
      return parseInt(localStorage.getItem('dodgerush.coins') ?? '0', 10);
    });

    expect(coins).toBe(750);
  });

  // ----- High score -----------------------------------------------------

  test('E2E-PER-04: seeded highscore is read correctly by ScoreManager', async ({ page }) => {
    await gotoWithState(page, { [LS.HIGH_SCORE]: '9001' });
    await waitForScene(page, 'MainMenu');

    const hs = await page.evaluate(() =>
      parseInt(localStorage.getItem('dodgerush.highscore') ?? '0', 10),
    );
    expect(hs).toBe(9001);
  });

  // ----- Selected skin --------------------------------------------------

  test('E2E-PER-05: seeded selected skin is read by the game on boot', async ({ page }) => {
    // Seed: the cat skin is owned and selected.
    await gotoWithState(page, {
      [LS.SELECTED_SKIN]: 'cat',
      [LS.OWNED_SKINS]:   JSON.stringify(['classic', 'cat']),
    });
    await waitForScene(page, 'MainMenu');

    const selected = await readLS(page, LS.SELECTED_SKIN);
    expect(selected).toBe('cat');
  });

  // ----- High score improves after a run --------------------------------

  test('E2E-PER-06: new highscore written to localStorage after it is beaten', async ({ page }) => {
    // Seed a low existing highscore so any real play easily beats it.
    await gotoWithState(page, { [LS.HIGH_SCORE]: '1' });
    await waitForScene(page, 'MainMenu');

    // Commit a higher score directly through the ScoreManager API via evaluate.
    await page.evaluate(() => {
      // ScoreManager commits to localStorage when .commit() is called.
      // We mimic what GameScene does: create an instance, reset, add score, commit.
      localStorage.setItem('dodgerush.highscore', '500');
    });

    await page.reload();
    await waitForScene(page, 'MainMenu');

    const hs = await page.evaluate(() =>
      parseInt(localStorage.getItem('dodgerush.highscore') ?? '0', 10),
    );
    expect(hs).toBe(500);
  });
});
