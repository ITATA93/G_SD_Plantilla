/**
 * auth-flow.spec.ts - E2E tests for the ClaveUnica authentication flow
 *
 * Tests the authentication endpoints defined in:
 *   src/core/auth/routes/auth.routes.ts
 *
 * IMPORTANT:
 *   - The /auth/login endpoint redirects to ClaveUnica (external IdP).
 *   - In E2E tests we verify the redirect behavior, NOT the full ClaveUnica
 *     flow (that requires a test ClaveUnica environment).
 *   - The /auth/callback endpoint is tested with mock parameters to verify
 *     error handling (missing params, expired state).
 *   - The /auth/me and /auth/logout endpoints require a valid session.
 *
 * AUTH FLOW OVERVIEW:
 *   1. GET /auth/login       -> 302 redirect to ClaveUnica authorization URL
 *   2. GET /auth/callback    -> ClaveUnica redirects back with code + state
 *   3. GET /auth/me          -> Returns authenticated user info (requires session)
 *   4. POST /auth/logout     -> Destroys session, clears cookie
 *
 * USAGE:
 *   npm run test:e2e
 *   npx playwright test tests/e2e/auth-flow.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('ClaveUnica Auth Flow @smoke', () => {
  test('GET /auth/login redirects to ClaveUnica', async ({ request }) => {
    const response = await request.get('/auth/login', {
      maxRedirects: 0, // Do not follow the redirect
    });

    // Should return a 302 redirect
    expect(response.status()).toBe(302);

    const location = response.headers()['location'];
    expect(location).toBeTruthy();

    // ClaveUnica authorization URL should contain the expected host
    // In development this may point to a test environment
    // The URL should contain standard OAuth2 parameters
    expect(location).toContain('response_type=code');
    expect(location).toContain('state=');
  });

  test('GET /auth/callback without params redirects to error', async ({ page }) => {
    // Calling callback without code and state should redirect to error page
    await page.goto('/auth/callback', { waitUntil: 'domcontentloaded' });

    // Should redirect to error page with a message
    const url = page.url();
    expect(url).toContain('/auth/error');
  });

  test('GET /auth/callback with error param shows error', async ({ page }) => {
    await page.goto(
      '/auth/callback?error=access_denied&error_description=User+cancelled',
      { waitUntil: 'domcontentloaded' },
    );

    const url = page.url();
    expect(url).toContain('/auth/error');
    expect(url).toContain('message=');
  });

  test('GET /auth/callback with invalid state redirects to error', async ({ page }) => {
    await page.goto(
      '/auth/callback?code=fake_code&state=invalid_state_token',
      { waitUntil: 'domcontentloaded' },
    );

    // Should fail due to invalid/expired state
    const url = page.url();
    expect(url).toContain('/auth/error');
  });
});

test.describe('Protected Endpoints (no session)', () => {
  test('GET /auth/me without session returns 401 or redirect', async ({ request }) => {
    const response = await request.get('/auth/me', {
      maxRedirects: 0,
    });

    // Without a valid session cookie, should return 401 or redirect to login
    expect([401, 302, 403]).toContain(response.status());
  });

  test('POST /auth/logout without session returns 401 or redirect', async ({ request }) => {
    const response = await request.post('/auth/logout', {
      maxRedirects: 0,
    });

    expect([401, 302, 403]).toContain(response.status());
  });
});

test.describe('Auth Error Page Visual', () => {
  test('error page renders with message @smoke', async ({ page }) => {
    // Trigger an auth error by providing bad callback params
    await page.goto(
      '/auth/callback?error=test_error&error_description=Test+error+message',
      { waitUntil: 'domcontentloaded' },
    );

    // Capture the error page for visual regression
    await expect(page).toHaveScreenshot('auth-error-page.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});

test.describe('Security Headers', () => {
  test('auth endpoints include security headers', async ({ request }) => {
    const response = await request.get('/auth/login', {
      maxRedirects: 0,
    });

    const headers = response.headers();

    // Helmet should set these headers
    // Note: exact header names depend on Helmet version and configuration
    const hasSecurityHeaders =
      headers['x-content-type-options'] === 'nosniff' ||
      headers['x-frame-options'] !== undefined ||
      headers['strict-transport-security'] !== undefined;

    expect(hasSecurityHeaders).toBeTruthy();
  });

  test('health endpoint includes security headers', async ({ request }) => {
    const response = await request.get('/health');
    const headers = response.headers();

    // At minimum, Helmet should prevent MIME sniffing
    expect(headers['x-content-type-options']).toBe('nosniff');
  });
});
