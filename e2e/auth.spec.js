import { test, expect } from '@playwright/test';
import { TEST_EMAIL, TEST_PASSWORD } from './helpers';

test.describe('Authentication', () => {
  test('register a new user', async ({ page }) => {
    await page.goto('/#/');
    const toggleLink = page.locator('[data-testid="link-toggle-auth"]');
    if (await toggleLink.isVisible().catch(() => false)) {
      await toggleLink.click();
    }

    await page.locator('[data-testid="input-email"]').fill(TEST_EMAIL);
    await page.locator('[data-testid="input-password"]').fill(TEST_PASSWORD);
    await page.locator('[data-testid="input-password-confirm"]').fill(TEST_PASSWORD);
    await page.locator('[data-testid="btn-submit"]').click();

    const result = await Promise.race([
      page
        .locator('[data-testid="tournament-name-row"]')
        .waitFor({ state: 'visible' })
        .then(() => 'success'),
      page
        .locator('[data-testid="login-error"]')
        .waitFor({ state: 'visible' })
        .then(() => 'error'),
    ]);

    if (result === 'error') {
      test.skip(true, 'User already registered');
    }
    expect(result).toBe('success');
  });

  test('login with existing user', async ({ page }) => {
    await page.goto('/#/');
    await page.locator('[data-testid="input-email"]').fill(TEST_EMAIL);
    await page.locator('[data-testid="input-password"]').fill(TEST_PASSWORD);
    await page.locator('[data-testid="btn-submit"]').click();
    await page.locator('[data-testid="tournament-name-row"]').waitFor({ state: 'visible' });
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/#/');
    await page.locator('[data-testid="input-email"]').fill(TEST_EMAIL);
    await page.locator('[data-testid="input-password"]').fill('WrongPassword999');
    await page.locator('[data-testid="btn-submit"]').click();
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  });
});
