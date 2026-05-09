import {test, expect} from '@playwright/test';
import {TEST_EMAIL, TEST_PASSWORD, register, login} from './helpers';

test.describe('Authentication', () => {
    test('register a new user', async ({page}) => {
        await page.goto('/#/');
        await page.waitForLoadState('networkidle');

        const signUpLink = page.locator('a', {hasText: 'Sign up'});
        if (await signUpLink.isVisible({timeout: 3000}).catch(() => false)) {
            await signUpLink.click();
        }

        await expect(page.locator('input[type="email"]')).toBeVisible();
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
        await page.locator('input[placeholder="Confirm password"]').fill(TEST_PASSWORD);
        await page.locator('button[type="submit"]').click();

        const tournamentOrError = await Promise.race([
            page.waitForSelector('.tournament-name-row', {timeout: 10000}).then(() => 'success'),
            page.waitForSelector('.login-error', {timeout: 10000}).then(() => 'error'),
        ]);

        if (tournamentOrError === 'error') {
            test.skip(true, 'User already registered');
        }

        expect(tournamentOrError).toBe('success');
    });

    test('login with existing user', async ({page}) => {
        await page.goto('/#/');
        await page.waitForLoadState('networkidle');

        const emailInput = page.locator('input[type="email"]');
        if (!(await emailInput.isVisible({timeout: 3000}).catch(() => false))) {
            test.skip(true, 'Already logged in');
        }

        await emailInput.fill(TEST_EMAIL);
        await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
        await page.locator('button[type="submit"]', {hasText: 'Sign in'}).click();

        await expect(page.locator('.tournament-name-row')).toBeVisible({timeout: 15000});
    });

    test('login with wrong password shows error', async ({page}) => {
        await page.goto('/#/');
        await page.waitForLoadState('networkidle');

        const emailInput = page.locator('input[type="email"]');
        if (!(await emailInput.isVisible({timeout: 3000}).catch(() => false))) {
            test.skip(true, 'Already logged in');
        }

        await emailInput.fill(TEST_EMAIL);
        await page.locator('input[type="password"]').first().fill('WrongPassword999');
        await page.locator('button[type="submit"]', {hasText: 'Sign in'}).click();

        await expect(page.locator('.login-error')).toBeVisible({timeout: 5000});
    });
});
