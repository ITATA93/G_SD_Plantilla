/**
 * health.spec.ts - E2E tests for the /health endpoints
 *
 * Validates that the health check endpoints return correct JSON structure
 * and HTTP status codes. These tests do NOT require database or Redis
 * connections (the app returns degraded status gracefully).
 *
 * Endpoints tested:
 *   GET /health      - Basic health check
 *   GET /health/ready - Kubernetes readiness probe
 *   GET /health/live  - Kubernetes liveness probe
 *
 * USAGE:
 *   npm run test:e2e
 *   npx playwright test tests/e2e/health.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Health Endpoints @smoke', () => {
  test('GET /health returns healthy status', async ({ request }) => {
    const response = await request.get('/health');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.timestamp).toBeTruthy();
    expect(body.app).toBeTruthy();
    expect(body.version).toBeTruthy();
  });

  test('GET /health/live returns alive status', async ({ request }) => {
    const response = await request.get('/health/live');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('alive');
    expect(body.timestamp).toBeTruthy();
  });

  test('GET /health/ready returns readiness status', async ({ request }) => {
    const response = await request.get('/health/ready');

    // May return 200 (ready) or 503 (not ready, e.g., no DB connection)
    expect([200, 503]).toContain(response.status());

    const body = await response.json();
    expect(['ready', 'not_ready']).toContain(body.status);
    expect(body.timestamp).toBeTruthy();
    expect(body.checks).toBeTruthy();
    expect(typeof body.checks.database).toBe('boolean');
    expect(typeof body.checks.redis).toBe('boolean');
  });

  test('health response has valid ISO timestamp', async ({ request }) => {
    const response = await request.get('/health');
    const body = await response.json();

    const date = new Date(body.timestamp);
    expect(date.getTime()).not.toBeNaN();

    // Timestamp should be recent (within last minute)
    const now = Date.now();
    const diff = now - date.getTime();
    expect(diff).toBeLessThan(60_000);
  });

  test('health endpoint sets correct content-type', async ({ request }) => {
    const response = await request.get('/health');
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });
});

test.describe('Health Page Visual', () => {
  test('health JSON renders in browser @smoke', async ({ page }) => {
    await page.goto('/health');

    // The browser renders JSON as plain text
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    // Parse the rendered JSON
    const json = JSON.parse(bodyText!);
    expect(json.status).toBe('healthy');

    // Visual baseline of the health endpoint response
    await expect(page).toHaveScreenshot('health-response.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});
