# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shop.spec.ts >> E2E-SHP — Shop scene >> E2E-SHP-03: buying a skin deducts coins and adds it to owned list
- Location: e2e/shop.spec.ts:95:3

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 600
Received:   600
```

# Test source

```ts
  14  |  *   pitchY  = (858 - 148) / 3  = 236.7   bandTop=148
  15  |  *   colPitch = 540 / 3          = 180
  16  |  *
  17  |  * Skin positions (game coords, row/col 0-based):
  18  |  *   classic [0] → row 0 col 0 → x=90,  y=266
  19  |  *   cat     [1] → row 0 col 1 → x=270, y=266
  20  |  *   hound   [2] → row 0 col 2 → x=450, y=266
  21  |  *   dragon  [3] → row 1 col 0 → x=90,  y=503
  22  |  */
  23  | import { test, expect } from '@playwright/test';
  24  | import {
  25  |   gotoWithState,
  26  |   waitForScene,
  27  |   startScene,
  28  |   tapGame,
  29  |   readLS,
  30  |   diagnosticErrors,
  31  |   LS,
  32  | } from './helpers';
  33  | 
  34  | // Derived layout constants (match ShopScene.create() logic exactly).
  35  | const COLS       = 3;
  36  | const BAND_TOP   = 148;
  37  | const BAND_BOT   = 858;
  38  | const PITCH_Y    = (BAND_BOT - BAND_TOP) / 3; // ≈ 236.7
  39  | const COL_PITCH  = 540 / COLS;                 // 180
  40  | const CX         = 270;
  41  | 
  42  | function shopCardPos(idx: number): { x: number; y: number } {
  43  |   const row     = Math.floor(idx / COLS);
  44  |   const col     = idx % COLS;
  45  |   const inRow   = Math.min(COLS, 9 - row * COLS);
  46  |   const startX  = CX - ((inRow - 1) * COL_PITCH) / 2;
  47  |   const x       = startX + col * COL_PITCH;
  48  |   const y       = BAND_TOP + PITCH_Y * (row + 0.5);
  49  |   return { x: Math.round(x), y: Math.round(y) };
  50  | }
  51  | 
  52  | // Card positions for the first few skins.
  53  | const POS_CLASSIC = shopCardPos(0); // x=90,  y=266
  54  | const POS_CAT     = shopCardPos(1); // x=270, y=266
  55  | const POS_DRAGON  = shopCardPos(3); // x=90,  y=503  (cost 520)
  56  | 
  57  | test.describe('E2E-SHP — Shop scene', () => {
  58  |   // ----- Shop renders without crash -------------------------------------
  59  | 
  60  |   test('E2E-SHP-01: ShopScene renders without diagnostics errors', async ({ page }) => {
  61  |     await gotoWithState(page);
  62  |     await waitForScene(page, 'MainMenu');
  63  |     await startScene(page, 'Shop');
  64  |     await waitForScene(page, 'Shop');
  65  | 
  66  |     const errors = await diagnosticErrors(page);
  67  |     expect(errors).toBe(0);
  68  |   });
  69  | 
  70  |   // ----- Equip an already-owned skin ------------------------------------
  71  | 
  72  |   test('E2E-SHP-02: tapping an owned skin equips it (updates dodgerush.skin)', async ({ page }) => {
  73  |     // Start with cat owned but classic selected.
  74  |     await gotoWithState(page, {
  75  |       [LS.SELECTED_SKIN]: 'classic',
  76  |       [LS.OWNED_SKINS]:   JSON.stringify(['classic', 'cat']),
  77  |     });
  78  |     await waitForScene(page, 'MainMenu');
  79  |     await startScene(page, 'Shop');
  80  |     await waitForScene(page, 'Shop');
  81  |     await page.waitForTimeout(200); // cards must be rendered
  82  | 
  83  |     await tapGame(page, POS_CAT.x, POS_CAT.y);
  84  |     await page.waitForTimeout(400); // scene restarts after equip
  85  | 
  86  |     // After scene.restart(), Shop re-creates, then we need it active again.
  87  |     await waitForScene(page, 'Shop');
  88  | 
  89  |     const selected = await readLS(page, LS.SELECTED_SKIN);
  90  |     expect(selected, 'dodgerush.skin must be updated to the equipped skin').toBe('cat');
  91  |   });
  92  | 
  93  |   // ----- Buy a skin with sufficient coins -------------------------------
  94  | 
  95  |   test('E2E-SHP-03: buying a skin deducts coins and adds it to owned list', async ({ page }) => {
  96  |     // Dragon costs 520 coins. Seed 600 so the buy succeeds.
  97  |     await gotoWithState(page, {
  98  |       [LS.COINS]:       '600',
  99  |       [LS.OWNED_SKINS]: JSON.stringify(['classic']),
  100 |     });
  101 |     await waitForScene(page, 'MainMenu');
  102 |     await startScene(page, 'Shop');
  103 |     await waitForScene(page, 'Shop');
  104 |     await page.waitForTimeout(200);
  105 | 
  106 |     await tapGame(page, POS_DRAGON.x, POS_DRAGON.y);
  107 |     await page.waitForTimeout(400); // scene restarts after buy
  108 | 
  109 |     await waitForScene(page, 'Shop');
  110 | 
  111 |     const coinsRaw = await readLS(page, LS.COINS);
  112 |     const owned    = JSON.parse((await readLS(page, LS.OWNED_SKINS)) ?? '[]') as string[];
  113 | 
> 114 |     expect(parseInt(coinsRaw ?? '600', 10)).toBeLessThan(600); // coins were deducted
      |                                             ^ Error: expect(received).toBeLessThan(expected)
  115 |     expect(owned).toContain('dragon');
  116 |   });
  117 | 
  118 |   // ----- Cannot buy with insufficient coins -----------------------------
  119 | 
  120 |   test('E2E-SHP-04: tapping an unaffordable skin leaves state unchanged', async ({ page }) => {
  121 |     // Only 10 coins — far less than any skin's cost (cheapest is cat at 400).
  122 |     await gotoWithState(page, {
  123 |       [LS.COINS]:       '10',
  124 |       [LS.OWNED_SKINS]: JSON.stringify(['classic']),
  125 |     });
  126 |     await waitForScene(page, 'MainMenu');
  127 |     await startScene(page, 'Shop');
  128 |     await waitForScene(page, 'Shop');
  129 |     await page.waitForTimeout(200);
  130 | 
  131 |     await tapGame(page, POS_CAT.x, POS_CAT.y);
  132 |     await page.waitForTimeout(400); // wait for any side effects
  133 | 
  134 |     // Coins must be unchanged and cat must not be owned.
  135 |     const coinsRaw = await readLS(page, LS.COINS);
  136 |     const owned    = JSON.parse((await readLS(page, LS.OWNED_SKINS)) ?? '[]') as string[];
  137 | 
  138 |     expect(parseInt(coinsRaw ?? '10', 10), 'coins must not be deducted for failed buy').toBe(10);
  139 |     expect(owned, 'cat must not be added to owned list').not.toContain('cat');
  140 |   });
  141 | 
  142 |   // ----- BACK button returns to MainMenu --------------------------------
  143 | 
  144 |   test('E2E-SHP-05: BACK button returns to MainMenuScene', async ({ page }) => {
  145 |     await gotoWithState(page);
  146 |     await waitForScene(page, 'MainMenu');
  147 |     await startScene(page, 'Shop');
  148 |     await waitForScene(page, 'Shop');
  149 | 
  150 |     // BACK button is at (270, 906) in game coords.
  151 |     await tapGame(page, CX, 906);
  152 |     await waitForScene(page, 'MainMenu', 8_000);
  153 |   });
  154 | });
  155 | 
```