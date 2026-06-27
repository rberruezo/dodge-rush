# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: daily.spec.ts >> E2E-DAI — Daily hub >> E2E-DAI-04: claiming streak reward grants coins and marks claim in state
- Location: e2e/daily.spec.ts:103:3

# Error details

```
Error: coins must increase after claiming streak reward

expect(received).toBeGreaterThan(expected)

Expected: > 100
Received:   100
```

# Test source

```ts
  21  |   tapGame,
  22  |   diagnosticErrors,
  23  |   LS,
  24  | } from './helpers';
  25  | 
  26  | /** Returns a YYYY-MM-DD string offset by `deltaDays` from today. */
  27  | function dayOffset(deltaDays: number): string {
  28  |   const d = new Date();
  29  |   d.setDate(d.getDate() + deltaDays);
  30  |   const y = d.getFullYear();
  31  |   const m = String(d.getMonth() + 1).padStart(2, '0');
  32  |   const day = String(d.getDate()).padStart(2, '0');
  33  |   return `${y}-${m}-${day}`;
  34  | }
  35  | 
  36  | /** Build a DailyState JSON where the streak reward can be claimed today. */
  37  | function claimableDailyState(streak = 2): string {
  38  |   return JSON.stringify({
  39  |     lastClaimDay: dayOffset(-1), // claimed yesterday → eligible again today
  40  |     streak,
  41  |     missions: null,
  42  |   });
  43  | }
  44  | 
  45  | /** Build a DailyState JSON where the reward was already claimed today. */
  46  | function alreadyClaimedDailyState(): string {
  47  |   return JSON.stringify({
  48  |     lastClaimDay: dayOffset(0), // claimed today → not eligible
  49  |     streak: 3,
  50  |     missions: null,
  51  |   });
  52  | }
  53  | 
  54  | test.describe('E2E-DAI — Daily hub', () => {
  55  |   // ----- Auto-open from MainMenu ----------------------------------------
  56  | 
  57  |   test('E2E-DAI-01: Daily hub auto-opens from MainMenu when streak is claimable', async ({ page }) => {
  58  |     await gotoWithState(page, {
  59  |       [LS.DAILY]: claimableDailyState(),
  60  |     });
  61  | 
  62  |     // Wait for MainMenu first; it auto-opens Daily after 420 ms when there is
  63  |     // an unclaimed reward. We wait up to 5 s for the Daily scene to become active.
  64  |     await waitForScene(page, 'MainMenu');
  65  |     await waitForScene(page, 'Daily', 5_000);
  66  | 
  67  |     const errors = await diagnosticErrors(page);
  68  |     expect(errors).toBe(0);
  69  |   });
  70  | 
  71  |   // ----- Daily does NOT auto-open when already claimed ------------------
  72  | 
  73  |   test('E2E-DAI-02: Daily hub does NOT auto-open when reward already claimed today', async ({ page }) => {
  74  |     await gotoWithState(page, {
  75  |       [LS.DAILY]: alreadyClaimedDailyState(),
  76  |     });
  77  |     await waitForScene(page, 'MainMenu');
  78  | 
  79  |     // Wait 1.5 s (well beyond the 420 ms trigger) and verify we're still on MainMenu.
  80  |     await page.waitForTimeout(1_500);
  81  | 
  82  |     const isDaily = await page.evaluate(() =>
  83  |       // eslint-disable-next-line @typescript-eslint/no-explicit-any
  84  |       (window as any).game?.scene?.isActive('Daily') === true,
  85  |     );
  86  |     expect(isDaily, 'Daily must NOT auto-open when reward already claimed').toBe(false);
  87  |   });
  88  | 
  89  |   // ----- DailyScene renders without crash --------------------------------
  90  | 
  91  |   test('E2E-DAI-03: DailyScene renders without diagnostics errors', async ({ page }) => {
  92  |     await gotoWithState(page, { [LS.DAILY]: claimableDailyState() });
  93  |     await waitForScene(page, 'MainMenu');
  94  |     await startScene(page, 'Daily');
  95  |     await waitForScene(page, 'Daily');
  96  | 
  97  |     const errors = await diagnosticErrors(page);
  98  |     expect(errors).toBe(0);
  99  |   });
  100 | 
  101 |   // ----- Claiming streak reward -----------------------------------------
  102 | 
  103 |   test('E2E-DAI-04: claiming streak reward grants coins and marks claim in state', async ({ page }) => {
  104 |     const startCoins = 100;
  105 |     await gotoWithState(page, {
  106 |       [LS.COINS]: String(startCoins),
  107 |       [LS.DAILY]: claimableDailyState(1), // streak=1, reward = 25 coins (index 0)
  108 |     });
  109 |     await waitForScene(page, 'MainMenu');
  110 |     await startScene(page, 'Daily');
  111 |     await waitForScene(page, 'Daily');
  112 |     await page.waitForTimeout(300); // let the render settle
  113 | 
  114 |     // The "CLAIM" button for the streak reward is rendered near the centre of
  115 |     // the streak band. DailyScene.renderStreak() places it around (270, 280).
  116 |     await tapGame(page, 270, 280);
  117 |     await page.waitForTimeout(500); // DailyScene re-renders after claim
  118 | 
  119 |     const coinsRaw = await readLS(page, LS.COINS);
  120 |     const coinsAfter = parseInt(coinsRaw ?? String(startCoins), 10);
> 121 |     expect(coinsAfter, 'coins must increase after claiming streak reward').toBeGreaterThan(startCoins);
      |                                                                            ^ Error: coins must increase after claiming streak reward
  122 | 
  123 |     // The daily state must now record today as `lastClaimDay`.
  124 |     const dailyRaw = await readLS(page, LS.DAILY);
  125 |     const dailyState = JSON.parse(dailyRaw ?? '{}');
  126 |     expect(dailyState.lastClaimDay).toBe(dayOffset(0));
  127 |   });
  128 | 
  129 |   // ----- BACK button returns to MainMenu --------------------------------
  130 | 
  131 |   test('E2E-DAI-05: BACK button in DailyScene returns to MainMenu', async ({ page }) => {
  132 |     await gotoWithState(page);
  133 |     await waitForScene(page, 'MainMenu');
  134 |     await startScene(page, 'Daily');
  135 |     await waitForScene(page, 'Daily');
  136 | 
  137 |     // BACK button is at (270, 918) in game coords.
  138 |     await tapGame(page, 270, 918);
  139 |     await waitForScene(page, 'MainMenu', 8_000);
  140 |   });
  141 | });
  142 | 
```