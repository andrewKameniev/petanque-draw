import { test, expect } from '@playwright/test';
import { assertBrowserEmulatorSentinel, E2E_RUN_ID, TEST_EMAIL, TEST_PASSWORD } from './helpers';

test.describe('Authentication', () => {
  test('register a new user', async ({ page }) => {
    const registrationEmail = `e2e-registration-${E2E_RUN_ID}@example.test`;
    const registrationPassword = `${TEST_PASSWORD}-registration`;
    await page.goto('/#/');
    await assertBrowserEmulatorSentinel(page);
    const toggleLink = page.locator('[data-testid="link-toggle-auth"]');
    if (await toggleLink.isVisible().catch(() => false)) {
      await toggleLink.click();
    }

    await page.locator('[data-testid="input-email"]').fill(registrationEmail);
    await page.locator('[data-testid="input-password"]').fill(registrationPassword);
    await page.locator('[data-testid="input-password-confirm"]').fill(registrationPassword);
    await page.locator('[data-testid="btn-submit"]').click();

    await expect(page.locator('[data-testid="tournament-name-row"]')).toBeVisible();
  });

  test('login with existing user', async ({ page }) => {
    await page.goto('/#/');
    await assertBrowserEmulatorSentinel(page);
    await page.locator('[data-testid="input-email"]').fill(TEST_EMAIL);
    await page.locator('[data-testid="input-password"]').fill(TEST_PASSWORD);
    await page.locator('[data-testid="btn-submit"]').click();
    await page.locator('[data-testid="tournament-name-row"]').waitFor({ state: 'visible' });
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/#/');
    await assertBrowserEmulatorSentinel(page);
    await page.locator('[data-testid="input-email"]').fill(TEST_EMAIL);
    await page.locator('[data-testid="input-password"]').fill(`${TEST_PASSWORD}-wrong`);
    await page.locator('[data-testid="btn-submit"]').click();
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  });
});
