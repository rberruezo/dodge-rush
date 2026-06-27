import { type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Storage keys (mirrors src/config/Constants.ts STORAGE_KEYS)
// ---------------------------------------------------------------------------
export const LS = {
  HIGH_SCORE:    'dodgerush.highscore',
  MUTED:         'dodgerush.muted',
  COINS:         'dodgerush.coins',
  OWNED_SKINS:   'dodgerush.skins',
  SELECTED_SKIN: 'dodgerush.skin',
  DIFFICULTY:    'dodgerush.difficulty',
  DAILY:         'dodgerush.daily',
  TOTAL_RUNS:    'dodgerush.totalruns',
} as const;

// Game canvas dimensions (matches Constants.ts)
export const GW = 540;
export const GH = 960;

// ---------------------------------------------------------------------------
// Boot helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to the root and seed localStorage *before* any game script runs.
 * Pass an empty object `{}` to navigate without seeding.
 */
export async function gotoWithState(
  page: Page,
  state: Record<string, string> = {},
): Promise<void> {
  if (Object.keys(state).length > 0) {
    await page.addInitScript((kv) => {
      for (const [k, v] of Object.entries(kv)) {
        localStorage.setItem(k, v);
      }
    }, state);
  }
  await page.goto('/');
}

/**
 * Wait until `window.game` exists (Phaser has booted) and the named scene is
 * active. Polls every 200 ms up to `timeout` ms.
 */
export async function waitForScene(
  page: Page,
  sceneName: string,
  timeout = 15_000,
): Promise<void> {
  await page.waitForFunction(
    (name) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).game;
      return g?.scene?.isActive(name) === true;
    },
    sceneName,
    { timeout, polling: 200 },
  );
}

/**
 * Wait until `window.game` exists regardless of which scene is active.
 */
export async function waitForGame(page: Page, timeout = 12_000): Promise<void> {
  await page.waitForFunction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => !!(window as any).game,
    undefined,
    { timeout, polling: 200 },
  );
}

// ---------------------------------------------------------------------------
// Phaser scene helpers
// ---------------------------------------------------------------------------

/**
 * Start a named scene programmatically (replaces the active exclusive scene).
 * Equivalent to calling `game.scene.start('Name', data)` in the browser.
 */
export async function startScene(
  page: Page,
  name: string,
  data?: Record<string, unknown>,
): Promise<void> {
  await page.evaluate(
    ([n, d]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).game.scene.start(n, d ?? undefined);
    },
    [name, data] as [string, Record<string, unknown> | undefined],
  );
}

/**
 * Read the `lives` field from a running GameScene (private field access via
 * Phaser's scene manager for testing purposes).
 */
export async function getGameLives(page: Page): Promise<number> {
  return page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scene = (window as any).game?.scene?.getScene('Game') as any;
    return scene?.lives ?? -1;
  });
}

// ---------------------------------------------------------------------------
// Diagnostics helpers
// ---------------------------------------------------------------------------

/** Number of `error`-level events logged since boot. */
export async function diagnosticErrors(page: Page): Promise<number> {
  return page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).diagnostics?.count('error') ?? 0;
  });
}

/** All recent diagnostics events as an array (for debugging failed tests). */
export async function diagnosticRecent(page: Page): Promise<unknown[]> {
  return page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return [...((window as any).diagnostics?.recent ?? [])];
  });
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

export async function readLS(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => localStorage.getItem(k), key);
}

export async function writeLS(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
}

export async function clearLS(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
}

// ---------------------------------------------------------------------------
// Canvas interaction helpers
// ---------------------------------------------------------------------------

/**
 * Click at a position expressed in *game* coordinates (0–540 × 0–960).
 * The canvas is FIT-scaled so this maps cleanly to CSS pixels when the
 * viewport is set to 540×960 (the default in playwright.config.ts).
 */
export async function tapGame(page: Page, gx: number, gy: number): Promise<void> {
  const canvas = page.locator('#game canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Game canvas not found in DOM');
  const sx = box.width  / GW;
  const sy = box.height / GH;
  await page.mouse.click(box.x + gx * sx, box.y + gy * sy);
}
