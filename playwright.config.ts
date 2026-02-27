/**
 * Playwright configuration for G_SD_Plantilla (Express + ClaveUnica)
 *
 * The Express app is started automatically by the `webServer` config below.
 * Tests run against the local dev server.
 *
 * Setup:
 *   1. npm install
 *   2. npx playwright install --with-deps chromium
 *   3. npm run test:e2e
 *
 * Environment:
 *   - E2E_BASE_URL: Override the base URL (default: http://localhost:3000)
 *   - CI: Set in CI pipelines, controls retries/reporters
 *
 * @see https://playwright.dev/docs/test-configuration
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'html' : 'list',
  timeout: 30_000,

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start the Express dev server before running tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/health',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
