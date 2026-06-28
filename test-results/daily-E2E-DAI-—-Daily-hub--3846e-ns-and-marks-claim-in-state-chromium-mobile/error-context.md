# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: daily.spec.ts >> E2E-DAI — Daily hub >> E2E-DAI-04: claiming streak reward grants coins and marks claim in state
- Location: e2e/daily.spec.ts:108:3

# Error details

```
Error: coins must increase after claiming streak reward

expect(received).toBeGreaterThan(expected)

Expected: > 100
Received:   100
```

# Test source

```ts
  26  | 
  27  | /** Returns a YYYY-MM-DD string offset by `deltaDays` from today. */
  28  | function dayOffset(deltaDays: number): string {
  29  |   const d = new Date();
  30  |   d.setDate(d.getDate() + deltaDays);
  31  |   const y = d.getFullYear();
  32  |   const m = String(d.getMonth() + 1).padStart(2, '0');
  33  |   const day = String(d.getDate()).padStart(2, '0');
  34  |   return `${y}-${m}-${day}`;
  35  | }
  36  | 
  37  | /** Build a DailyState JSON where the streak reward can be claimed today. */
  38  | function claimableDailyState(streak = 2): string {
  39  |   return JSON.stringify({
  40  |     lastClaimDay: dayOffset(-1), // claimed yesterday → eligible again today
  41  |     streak,
  42  |     missions: null,
  43  |   });
  44  | }
  45  | 
  46  | /** Build a DailyState JSON where the reward was already claimed today. */
  47  | function alreadyClaimedDailyState(): string {
  48  |   return JSON.stringify({
  49  |     lastClaimDay: dayOffset(0), // claimed today → not eligible
  50  |     streak: 3,
  51  |     missions: null,
  52  |   });
  53  | }
  54  | 
  55  | test.describe('E2E-DAI — Daily hub', () => {
  56  |   // ----- Auto-open from MainMenu ----------------------------------------
  57  | 
  58  |   test('E2E-DAI-01: Daily hub auto-opens from MainMenu when streak is claimable', async ({ page }) => {
  59  |     // MVP v1.0: DAILY is disabled, so the hub must NOT auto-open even when a
  60  |     // reward is seeded as claimable. When the feature is re-enabled (v1.1) the
  61  |     // hub auto-opens as the retention hook.
  62  |     test.skip(!FEATURES.DAILY_ENABLED, 'DAILY disabled in MVP v1.0 — auto-open is off');
  63  |     await gotoWithState(page, {
  64  |       [LS.DAILY]: claimableDailyState(),
  65  |     });
  66  | 
  67  |     // Wait for MainMenu first; it auto-opens Daily after 420 ms when there is
  68  |     // an unclaimed reward. We wait up to 5 s for the Daily scene to become active.
  69  |     await waitForScene(page, 'MainMenu');
  70  |     await waitForScene(page, 'Daily', 5_000);
  71  | 
  72  |     const errors = await diagnosticErrors(page);
  73  |     expect(errors).toBe(0);
  74  |   });
  75  | 
  76  |   // ----- Daily does NOT auto-open when already claimed ------------------
  77  | 
  78  |   test('E2E-DAI-02: Daily hub does NOT auto-open when reward already claimed today', async ({ page }) => {
  79  |     await gotoWithState(page, {
  80  |       [LS.DAILY]: alreadyClaimedDailyState(),
  81  |     });
  82  |     await waitForScene(page, 'MainMenu');
  83  | 
  84  |     // Wait 1.5 s (well beyond the 420 ms trigger) and verify we're still on MainMenu.
  85  |     await page.waitForTimeout(1_500);
  86  | 
  87  |     const isDaily = await page.evaluate(() =>
  88  |       // eslint-disable-next-line @typescript-eslint/no-explicit-any
  89  |       (window as any).game?.scene?.isActive('Daily') === true,
  90  |     );
  91  |     expect(isDaily, 'Daily must NOT auto-open when reward already claimed').toBe(false);
  92  |   });
  93  | 
  94  |   // ----- DailyScene renders without crash --------------------------------
  95  | 
  96  |   test('E2E-DAI-03: DailyScene renders without diagnostics errors', async ({ page }) => {
  97  |     await gotoWithState(page, { [LS.DAILY]: claimableDailyState() });
  98  |     await waitForScene(page, 'MainMenu');
  99  |     await startScene(page, 'Daily');
  100 |     await waitForScene(page, 'Daily');
  101 | 
  102 |     const errors = await diagnosticErrors(page);
  103 |     expect(errors).toBe(0);
  104 |   });
  105 | 
  106 |   // ----- Claiming streak reward -----------------------------------------
  107 | 
  108 |   test('E2E-DAI-04: claiming streak reward grants coins and marks claim in state', async ({ page }) => {
  109 |     const startCoins = 100;
  110 |     await gotoWithState(page, {
  111 |       [LS.COINS]: String(startCoins),
  112 |       [LS.DAILY]: claimableDailyState(1), // streak=1, reward = 25 coins (index 0)
  113 |     });
  114 |     await waitForScene(page, 'MainMenu');
  115 |     await startScene(page, 'Daily');
  116 |     await waitForScene(page, 'Daily');
  117 |     await page.waitForTimeout(300); // let the render settle
  118 | 
  119 |     // The "CLAIM" button for the streak reward is rendered near the centre of
  120 |     // the streak band. DailyScene.renderStreak() places it around (270, 280).
  121 |     await tapGame(page, 270, 280);
  122 |     await page.waitForTimeout(500); // DailyScene re-renders after claim
  123 | 
  124 |     const coinsRaw = await readLS(page, LS.COINS);
  125 |     const coinsAfter = parseInt(coinsRaw ?? String(startCoins), 10);
> 126 |     expect(coinsAfter, 'coins must increase after claiming streak reward').toBeGreaterThan(startCoins);
      |                                                                            ^ Error: coins must increase after claiming streak reward
  127 | 
  128 |     // The daily state must now record today as `lastClaimDay`.
  129 |     const dailyRaw = await readLS(page, LS.DAILY);
  130 |     const dailyState = JSON.parse(dailyRaw ?? '{}');
  131 |     expect(dailyState.lastClaimDay).toBe(dayOffset(0));
  132 |   });
  133 | 
  134 |   // ----- BACK button returns to MainMenu --------------------------------
  135 | 
  136 |   test('E2E-DAI-05: BACK button in DailyScene returns to MainMenu', async ({ page }) => {
  137 |     await gotoWithState(page);
  138 |     await waitForScene(page, 'MainMenu');
  139 |     await startScene(page, 'Daily');
  140 |     await waitForScene(page, 'Daily');
  141 | 
  142 |     // BACK button is at (270, 918) in game coords.
  143 |     await tapGame(page, 270, 918);
  144 |     await waitForScene(page, 'MainMenu', 8_000);
  145 |   });
  146 | });
  147 | 
```