# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: persistence.spec.ts >> E2E-PER — Persistence across reload >> E2E-PER-06: new highscore written to localStorage after it is beaten
- Location: e2e/persistence.spec.ts:124:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 500
Received: 1
```

# Test source

```ts
  42  |     const afterToggle = await readLS(page, LS.MUTED);
  43  |     expect(afterToggle, 'muted flag should be written to localStorage').toBe('1');
  44  | 
  45  |     // Reload and verify the flag survived.
  46  |     await page.reload();
  47  |     await waitForScene(page, 'MainMenu');
  48  | 
  49  |     const afterReload = await readLS(page, LS.MUTED);
  50  |     expect(afterReload, 'muted state must survive page reload').toBe('1');
  51  |   });
  52  | 
  53  |   // ----- Difficulty toggle ----------------------------------------------
  54  | 
  55  |   test('E2E-PER-02: difficulty toggle persists after page reload', async ({ page }) => {
  56  |     // Boot without any difficulty set → defaults to "classic".
  57  |     await gotoWithState(page);
  58  |     await waitForScene(page, 'MainMenu');
  59  | 
  60  |     const initial = await readLS(page, LS.DIFFICULTY);
  61  |     // Initial value is either null (not yet persisted) or 'classic'.
  62  |     expect(['classic', null]).toContain(initial);
  63  | 
  64  |     // The difficulty toggle is at bottom-left: (22, GAME_HEIGHT - 22).
  65  |     // Tap it to switch to RELAX.
  66  |     await tapGame(page, 50, GH - 22);
  67  |     await page.waitForTimeout(300);
  68  | 
  69  |     const afterToggle = await readLS(page, LS.DIFFICULTY);
  70  |     expect(afterToggle, 'difficulty must be written to localStorage after toggle').toBe('relax');
  71  | 
  72  |     await page.reload();
  73  |     await waitForScene(page, 'MainMenu');
  74  | 
  75  |     const afterReload = await readLS(page, LS.DIFFICULTY);
  76  |     expect(afterReload, 'difficulty must survive page reload').toBe('relax');
  77  |   });
  78  | 
  79  |   // ----- Coin balance ---------------------------------------------------
  80  | 
  81  |   test('E2E-PER-03: seeded coin balance is read correctly by ProfileManager', async ({ page }) => {
  82  |     await gotoWithState(page, { [LS.COINS]: '750' });
  83  |     await waitForScene(page, 'MainMenu');
  84  | 
  85  |     const coins = await page.evaluate(() => {
  86  |       // eslint-disable-next-line @typescript-eslint/no-explicit-any
  87  |       const g = (window as any).game;
  88  |       // Access Profile singleton via an active scene's manager (if imported).
  89  |       // Fallback: read directly from localStorage as the game would see it.
  90  |       return parseInt(localStorage.getItem('dodgerush.coins') ?? '0', 10);
  91  |     });
  92  | 
  93  |     expect(coins).toBe(750);
  94  |   });
  95  | 
  96  |   // ----- High score -----------------------------------------------------
  97  | 
  98  |   test('E2E-PER-04: seeded highscore is read correctly by ScoreManager', async ({ page }) => {
  99  |     await gotoWithState(page, { [LS.HIGH_SCORE]: '9001' });
  100 |     await waitForScene(page, 'MainMenu');
  101 | 
  102 |     const hs = await page.evaluate(() =>
  103 |       parseInt(localStorage.getItem('dodgerush.highscore') ?? '0', 10),
  104 |     );
  105 |     expect(hs).toBe(9001);
  106 |   });
  107 | 
  108 |   // ----- Selected skin --------------------------------------------------
  109 | 
  110 |   test('E2E-PER-05: seeded selected skin is read by the game on boot', async ({ page }) => {
  111 |     // Seed: the cat skin is owned and selected.
  112 |     await gotoWithState(page, {
  113 |       [LS.SELECTED_SKIN]: 'cat',
  114 |       [LS.OWNED_SKINS]:   JSON.stringify(['classic', 'cat']),
  115 |     });
  116 |     await waitForScene(page, 'MainMenu');
  117 | 
  118 |     const selected = await readLS(page, LS.SELECTED_SKIN);
  119 |     expect(selected).toBe('cat');
  120 |   });
  121 | 
  122 |   // ----- High score improves after a run --------------------------------
  123 | 
  124 |   test('E2E-PER-06: new highscore written to localStorage after it is beaten', async ({ page }) => {
  125 |     // Seed a low existing highscore so any real play easily beats it.
  126 |     await gotoWithState(page, { [LS.HIGH_SCORE]: '1' });
  127 |     await waitForScene(page, 'MainMenu');
  128 | 
  129 |     // Commit a higher score directly through the ScoreManager API via evaluate.
  130 |     await page.evaluate(() => {
  131 |       // ScoreManager commits to localStorage when .commit() is called.
  132 |       // We mimic what GameScene does: create an instance, reset, add score, commit.
  133 |       localStorage.setItem('dodgerush.highscore', '500');
  134 |     });
  135 | 
  136 |     await page.reload();
  137 |     await waitForScene(page, 'MainMenu');
  138 | 
  139 |     const hs = await page.evaluate(() =>
  140 |       parseInt(localStorage.getItem('dodgerush.highscore') ?? '0', 10),
  141 |     );
> 142 |     expect(hs).toBe(500);
      |                ^ Error: expect(received).toBe(expected) // Object.is equality
  143 |   });
  144 | });
  145 | 
```