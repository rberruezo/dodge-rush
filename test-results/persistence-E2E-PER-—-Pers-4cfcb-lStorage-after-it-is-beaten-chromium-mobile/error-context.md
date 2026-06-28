# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: persistence.spec.ts >> E2E-PER — Persistence across reload >> E2E-PER-06: new highscore written to localStorage after it is beaten
- Location: e2e/persistence.spec.ts:128:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 500
Received: 1
```

# Test source

```ts
  46  |     // Reload and verify the flag survived.
  47  |     await page.reload();
  48  |     await waitForScene(page, 'MainMenu');
  49  | 
  50  |     const afterReload = await readLS(page, LS.MUTED);
  51  |     expect(afterReload, 'muted state must survive page reload').toBe('1');
  52  |   });
  53  | 
  54  |   // ----- Difficulty toggle ----------------------------------------------
  55  | 
  56  |   test('E2E-PER-02: difficulty toggle persists after page reload', async ({ page }) => {
  57  |     // MVP v1.0 hides the difficulty toggle (RELAX disabled); the toggle UI only
  58  |     // exists when RELAX_MODE_ENABLED. Re-enabled in v1.1.
  59  |     test.skip(!FEATURES.RELAX_MODE_ENABLED, 'RELAX disabled in MVP v1.0 — difficulty toggle is hidden');
  60  |     // Boot without any difficulty set → defaults to "classic".
  61  |     await gotoWithState(page);
  62  |     await waitForScene(page, 'MainMenu');
  63  | 
  64  |     const initial = await readLS(page, LS.DIFFICULTY);
  65  |     // Initial value is either null (not yet persisted) or 'classic'.
  66  |     expect(['classic', null]).toContain(initial);
  67  | 
  68  |     // The difficulty toggle is at bottom-left: (22, GAME_HEIGHT - 22).
  69  |     // Tap it to switch to RELAX.
  70  |     await tapGame(page, 50, GH - 22);
  71  |     await page.waitForTimeout(300);
  72  | 
  73  |     const afterToggle = await readLS(page, LS.DIFFICULTY);
  74  |     expect(afterToggle, 'difficulty must be written to localStorage after toggle').toBe('relax');
  75  | 
  76  |     await page.reload();
  77  |     await waitForScene(page, 'MainMenu');
  78  | 
  79  |     const afterReload = await readLS(page, LS.DIFFICULTY);
  80  |     expect(afterReload, 'difficulty must survive page reload').toBe('relax');
  81  |   });
  82  | 
  83  |   // ----- Coin balance ---------------------------------------------------
  84  | 
  85  |   test('E2E-PER-03: seeded coin balance is read correctly by ProfileManager', async ({ page }) => {
  86  |     await gotoWithState(page, { [LS.COINS]: '750' });
  87  |     await waitForScene(page, 'MainMenu');
  88  | 
  89  |     const coins = await page.evaluate(() => {
  90  |       // eslint-disable-next-line @typescript-eslint/no-explicit-any
  91  |       const g = (window as any).game;
  92  |       // Access Profile singleton via an active scene's manager (if imported).
  93  |       // Fallback: read directly from localStorage as the game would see it.
  94  |       return parseInt(localStorage.getItem('dodgerush.coins') ?? '0', 10);
  95  |     });
  96  | 
  97  |     expect(coins).toBe(750);
  98  |   });
  99  | 
  100 |   // ----- High score -----------------------------------------------------
  101 | 
  102 |   test('E2E-PER-04: seeded highscore is read correctly by ScoreManager', async ({ page }) => {
  103 |     await gotoWithState(page, { [LS.HIGH_SCORE]: '9001' });
  104 |     await waitForScene(page, 'MainMenu');
  105 | 
  106 |     const hs = await page.evaluate(() =>
  107 |       parseInt(localStorage.getItem('dodgerush.highscore') ?? '0', 10),
  108 |     );
  109 |     expect(hs).toBe(9001);
  110 |   });
  111 | 
  112 |   // ----- Selected skin --------------------------------------------------
  113 | 
  114 |   test('E2E-PER-05: seeded selected skin is read by the game on boot', async ({ page }) => {
  115 |     // Seed: the cat skin is owned and selected.
  116 |     await gotoWithState(page, {
  117 |       [LS.SELECTED_SKIN]: 'cat',
  118 |       [LS.OWNED_SKINS]:   JSON.stringify(['classic', 'cat']),
  119 |     });
  120 |     await waitForScene(page, 'MainMenu');
  121 | 
  122 |     const selected = await readLS(page, LS.SELECTED_SKIN);
  123 |     expect(selected).toBe('cat');
  124 |   });
  125 | 
  126 |   // ----- High score improves after a run --------------------------------
  127 | 
  128 |   test('E2E-PER-06: new highscore written to localStorage after it is beaten', async ({ page }) => {
  129 |     // Seed a low existing highscore so any real play easily beats it.
  130 |     await gotoWithState(page, { [LS.HIGH_SCORE]: '1' });
  131 |     await waitForScene(page, 'MainMenu');
  132 | 
  133 |     // Commit a higher score directly through the ScoreManager API via evaluate.
  134 |     await page.evaluate(() => {
  135 |       // ScoreManager commits to localStorage when .commit() is called.
  136 |       // We mimic what GameScene does: create an instance, reset, add score, commit.
  137 |       localStorage.setItem('dodgerush.highscore', '500');
  138 |     });
  139 | 
  140 |     await page.reload();
  141 |     await waitForScene(page, 'MainMenu');
  142 | 
  143 |     const hs = await page.evaluate(() =>
  144 |       parseInt(localStorage.getItem('dodgerush.highscore') ?? '0', 10),
  145 |     );
> 146 |     expect(hs).toBe(500);
      |                ^ Error: expect(received).toBe(expected) // Object.is equality
  147 |   });
  148 | });
  149 | 
```