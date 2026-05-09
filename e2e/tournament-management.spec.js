import {test, expect} from '@playwright/test';
import {
    ensureLoggedIn, ensureCleanTournament, addTeams, drawFirstRound, playRound,
    deleteCurrentTournament, deleteAllTournaments,
} from './helpers';

test.describe('Tournament Management', () => {
    test.beforeEach(async ({page}) => {
        await ensureLoggedIn(page);
    });

    test('create and delete empty tournament', async ({page}) => {
        const deleteBtn = page.locator('.bottom-actions__btn--danger');
        if (await deleteBtn.isVisible({timeout: 2000}).catch(() => false)) {
            await deleteBtn.click();
            await page.waitForTimeout(300);
            const confirmBtn = page.locator('button', {hasText: /Remove|Видалити/}).last();
            await confirmBtn.click();
            await page.waitForTimeout(500);
        }

        await expect(page.locator('.tournament-name-row')).toBeVisible();
    });

    test('tournament limit — cannot exceed 10 tournaments', async ({page}) => {
        test.setTimeout(120000);

        await deleteAllTournaments(page);

        for (let i = 0; i < 10; i++) {
            const addLink = page.locator('a, button', {hasText: /Add new tournament|Додати новий/});
            if (await addLink.isVisible({timeout: 2000}).catch(() => false)) {
                await addLink.first().click();
                await page.waitForTimeout(500);
            }
        }

        const addLink = page.locator('a, button', {hasText: /Add new tournament|Додати новий/});
        if (await addLink.isVisible({timeout: 1000}).catch(() => false)) {
            await addLink.first().click();
            await page.waitForTimeout(500);
        }

        const errorMsg = page.locator('text=/maximum|максимум/i');
        const hasError = await errorMsg.isVisible({timeout: 2000}).catch(() => false);

        await deleteAllTournaments(page);
        expect(hasError).toBeTruthy();
    });

    test('rename tournament inline', async ({page}) => {
        await ensureCleanTournament(page);
        const name = page.locator('.tournament-name-row strong');
        await name.click();
        await page.waitForTimeout(200);

        const input = page.locator('.inline-name-input');
        await expect(input).toBeVisible();
        await input.fill('My Test Tournament');
        await page.locator('.inline-name-btn--save').click();

        await expect(page.locator('text=My Test Tournament')).toBeVisible();
        await deleteCurrentTournament(page);
    });

    test('restore round works once', async ({page}) => {
        await ensureCleanTournament(page);
        await addTeams(page, 8);
        await drawFirstRound(page);
        await playRound(page);

        const restoreLink = page.locator('a', {hasText: /Restore|Відновити/});
        await expect(restoreLink).toBeVisible({timeout: 3000});
        await restoreLink.click();
        await page.waitForTimeout(500);

        const restoreAgain = page.locator('a', {hasText: /Restore|Відновити/});
        await expect(restoreAgain).not.toBeVisible({timeout: 2000});

        await deleteCurrentTournament(page);
    });

    test('delete tournament from preferences', async ({page}) => {
        await ensureCleanTournament(page);
        await addTeams(page, 4);
        await drawFirstRound(page);
        await playRound(page);

        const prefsBtn = page.locator('button', {hasText: /Preferences|Налаштування/});
        await prefsBtn.click();
        await page.waitForTimeout(300);

        const removeBtn = page.locator('.prefs button', {hasText: /Remove tournament|Видалити турнір/});
        await expect(removeBtn).toBeVisible();
        await removeBtn.click();
        await page.waitForTimeout(300);

        const confirmBtn = page.locator('button', {hasText: /Remove|Видалити/}).last();
        await confirmBtn.click();
        await page.waitForTimeout(500);

        const prefsModal = page.locator('.prefs');
        await expect(prefsModal).not.toBeVisible({timeout: 2000});
    });

    test('pin tournament as default', async ({page}) => {
        await ensureCleanTournament(page);
        const pinBtn = page.locator('.pin-btn');
        await pinBtn.click();
        await page.waitForTimeout(300);

        await expect(pinBtn).toHaveClass(/pin-btn--active/);

        await pinBtn.click();
        await page.waitForTimeout(300);
        await deleteCurrentTournament(page);
    });
});
