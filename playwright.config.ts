import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config for Dodge Rush.
 *
 * Tests run against the Vite dev server (not the built bundle) because
 * `window.game`, `window.diagnostics`, and `window.sound` are only exposed
 * when `import.meta.env.DEV === true`.
 *
 * Run:
 *   npm run playwright:install   # one-time: download Chromium
 *   npm run test:e2e             # headless
 *   npm run test:e2e:ui          # interactive Playwright UI
 *   npm run test:e2e:debug       # step through with DevTools
 */
export default defineConfig({
  testDir: './e2e',
  // Each spec file runs serially so the shared dev server state is predictable.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 25_000,

  use: {
    baseURL: 'http://localhost:5173',
    // Portrait mobile viewport matching the game's native 540×960 resolution.
    // With Phaser.Scale.FIT the canvas fills this exactly → game coords = CSS px.
    viewport: { width: 540, height: 960 },
    // Capture screenshots and traces only on failure (CI-friendly).
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    // The game uses pointer events; enable touch emulation.
    hasTouch: true,
  },

  projects: [
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 540, height: 960 },
      },
    },
  ],

  // Auto-start the Vite dev server; reuse it if already running locally.
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
