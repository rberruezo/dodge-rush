/**
 * E2E-SHP — Shop scene: equip, buy, and coin-guard
 *
 * The ShopScene is a pure localStorage-backed UI: every action (equip / buy)
 * is reflected immediately in `dodgerush.skin` and `dodgerush.skins`.
 * Tests seed a known wallet+inventory state, navigate to the shop, trigger
 * the action, and verify the resulting localStorage state.
 *
 * Canvas-coordinate clicks are used for buy/equip actions because the shop
 * renders cards at deterministic positions (3-column grid, known SKINS order).
 * Coordinates are calculated from the same layout constants as the source:
 *
 *   cols = 3, SKINS.length = 9, rows = 3
 *   pitchY  = (858 - 148) / 3  = 236.7   bandTop=148
 *   colPitch = 540 / 3          = 180
 *
 * Skin positions (game coords, row/col 0-based):
 *   classic [0] → row 0 col 0 → x=90,  y=266
 *   cat     [1] → row 0 col 1 → x=270, y=266
 *   hound   [2] → row 0 col 2 → x=450, y=266
 *   dragon  [3] → row 1 col 0 → x=90,  y=503
 */
import { test, expect } from '@playwright/test';
import {
  gotoWithState,
  waitForScene,
  startScene,
  tapGame,
  readLS,
  diagnosticErrors,
  LS,
} from './helpers';

// Derived layout constants (match ShopScene.create() logic exactly).
const COLS       = 3;
const BAND_TOP   = 148;
const BAND_BOT   = 858;
const PITCH_Y    = (BAND_BOT - BAND_TOP) / 3; // ≈ 236.7
const COL_PITCH  = 540 / COLS;                 // 180
const CX         = 270;

function shopCardPos(idx: number): { x: number; y: number } {
  const row     = Math.floor(idx / COLS);
  const col     = idx % COLS;
  const inRow   = Math.min(COLS, 9 - row * COLS);
  const startX  = CX - ((inRow - 1) * COL_PITCH) / 2;
  const x       = startX + col * COL_PITCH;
  const y       = BAND_TOP + PITCH_Y * (row + 0.5);
  return { x: Math.round(x), y: Math.round(y) };
}

// Card positions for the first few skins.
const POS_CLASSIC = shopCardPos(0); // x=90,  y=266
const POS_CAT     = shopCardPos(1); // x=270, y=266
const POS_DRAGON  = shopCardPos(3); // x=90,  y=503  (cost 520)

test.describe('E2E-SHP — Shop scene', () => {
  // ----- Shop renders without crash -------------------------------------

  test('E2E-SHP-01: ShopScene renders without diagnostics errors', async ({ page }) => {
    await gotoWithState(page);
    await waitForScene(page, 'MainMenu');
    await startScene(page, 'Shop');
    await waitForScene(page, 'Shop');

    const errors = await diagnosticErrors(page);
    expect(errors).toBe(0);
  });

  // ----- Equip an already-owned skin ------------------------------------

  test('E2E-SHP-02: tapping an owned skin equips it (updates dodgerush.skin)', async ({ page }) => {
    // Start with cat owned but classic selected.
    await gotoWithState(page, {
      [LS.SELECTED_SKIN]: 'classic',
      [LS.OWNED_SKINS]:   JSON.stringify(['classic', 'cat']),
    });
    await waitForScene(page, 'MainMenu');
    await startScene(page, 'Shop');
    await waitForScene(page, 'Shop');
    await page.waitForTimeout(200); // cards must be rendered

    await tapGame(page, POS_CAT.x, POS_CAT.y);
    await page.waitForTimeout(400); // scene restarts after equip

    // After scene.restart(), Shop re-creates, then we need it active again.
    await waitForScene(page, 'Shop');

    const selected = await readLS(page, LS.SELECTED_SKIN);
    expect(selected, 'dodgerush.skin must be updated to the equipped skin').toBe('cat');
  });

  // ----- Buy a skin with sufficient coins -------------------------------

  test('E2E-SHP-03: buying a skin deducts coins and adds it to owned list', async ({ page }) => {
    // Dragon costs 520 coins. Seed 600 so the buy succeeds.
    await gotoWithState(page, {
      [LS.COINS]:       '600',
      [LS.OWNED_SKINS]: JSON.stringify(['classic']),
    });
    await waitForScene(page, 'MainMenu');
    await startScene(page, 'Shop');
    await waitForScene(page, 'Shop');
    await page.waitForTimeout(200);

    await tapGame(page, POS_DRAGON.x, POS_DRAGON.y);
    await page.waitForTimeout(400); // scene restarts after buy

    await waitForScene(page, 'Shop');

    const coinsRaw = await readLS(page, LS.COINS);
    const owned    = JSON.parse((await readLS(page, LS.OWNED_SKINS)) ?? '[]') as string[];

    expect(parseInt(coinsRaw ?? '600', 10)).toBeLessThan(600); // coins were deducted
    expect(owned).toContain('dragon');
  });

  // ----- Cannot buy with insufficient coins -----------------------------

  test('E2E-SHP-04: tapping an unaffordable skin leaves state unchanged', async ({ page }) => {
    // Only 10 coins — far less than any skin's cost (cheapest is cat at 400).
    await gotoWithState(page, {
      [LS.COINS]:       '10',
      [LS.OWNED_SKINS]: JSON.stringify(['classic']),
    });
    await waitForScene(page, 'MainMenu');
    await startScene(page, 'Shop');
    await waitForScene(page, 'Shop');
    await page.waitForTimeout(200);

    await tapGame(page, POS_CAT.x, POS_CAT.y);
    await page.waitForTimeout(400); // wait for any side effects

    // Coins must be unchanged and cat must not be owned.
    const coinsRaw = await readLS(page, LS.COINS);
    const owned    = JSON.parse((await readLS(page, LS.OWNED_SKINS)) ?? '[]') as string[];

    expect(parseInt(coinsRaw ?? '10', 10), 'coins must not be deducted for failed buy').toBe(10);
    expect(owned, 'cat must not be added to owned list').not.toContain('cat');
  });

  // ----- BACK button returns to MainMenu --------------------------------

  test('E2E-SHP-05: BACK button returns to MainMenuScene', async ({ page }) => {
    await gotoWithState(page);
    await waitForScene(page, 'MainMenu');
    await startScene(page, 'Shop');
    await waitForScene(page, 'Shop');

    // BACK button is at (270, 906) in game coords.
    await tapGame(page, CX, 906);
    await waitForScene(page, 'MainMenu', 8_000);
  });
});
