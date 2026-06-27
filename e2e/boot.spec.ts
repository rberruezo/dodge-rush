/**
 * E2E-BOOT — App boot and initial render
 *
 * Verifies that the full boot sequence (BootScene → PreloadScene → MainMenuScene)
 * completes without crashes and that the dev-mode window globals are accessible.
 *
 * These are the fastest E2E tests; they form the smoke-test gate that blocks
 * all other suites if the app can't even reach the main menu.
 */
import { test, expect } from '@playwright/test';
import { gotoWithState, waitForScene, diagnosticErrors, GW, GH } from './helpers';

test.describe('E2E-BOOT — App boot', () => {
  test('E2E-BOOT-01: reaches MainMenuScene within 15 s', async ({ page }) => {
    await gotoWithState(page);
    // The normal boot path is: Boot → Preload (asset loading) → MainMenu.
    await waitForScene(page, 'MainMenu', 15_000);
  });

  test('E2E-BOOT-02: no diagnostics errors logged during boot', async ({ page }) => {
    await gotoWithState(page);
    await waitForScene(page, 'MainMenu');

    const errors = await diagnosticErrors(page);
    expect(errors, 'window.diagnostics should have 0 error events after clean boot').toBe(0);
  });

  test('E2E-BOOT-03: canvas is visible with correct aspect ratio', async ({ page }) => {
    await gotoWithState(page);
    await waitForScene(page, 'MainMenu');

    const canvas = page.locator('#game canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box, 'Canvas bounding box must exist').not.toBeNull();

    // With a 540×960 viewport the FIT scale should produce a 1:1 canvas.
    // We allow ±2 px for sub-pixel rounding by the scale manager.
    expect(box!.width).toBeGreaterThanOrEqual(GW - 2);
    expect(box!.height).toBeGreaterThanOrEqual(GH - 2);

    const ratio = box!.width / box!.height;
    const expected = GW / GH;
    expect(ratio).toBeCloseTo(expected, 1); // within ~10 % tolerance
  });

  test('E2E-BOOT-04: dev-mode window globals are exposed', async ({ page }) => {
    await gotoWithState(page);
    await waitForScene(page, 'MainMenu');

    const globals = await page.evaluate(() => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hasGame:        typeof (window as any).game === 'object',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hasDiagnostics: typeof (window as any).diagnostics === 'object',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hasSound:       typeof (window as any).sound === 'object',
    }));

    expect(globals.hasGame,        'window.game must be exposed in DEV mode').toBe(true);
    expect(globals.hasDiagnostics, 'window.diagnostics must be exposed in DEV mode').toBe(true);
    expect(globals.hasSound,       'window.sound must be exposed in DEV mode').toBe(true);
  });
});
