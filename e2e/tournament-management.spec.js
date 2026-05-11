import {test, expect} from '@playwright/test';
import {
    login, ensureCleanTournament, addTeams, selectSystem, drawFirstRound, playRound,
    deleteCurrentTournament, dismissModals,
} from './helpers';

test.describe('Tournament Management', () => {
    test.beforeEach(async ({page}) => {
        await login(page);
    });

    test('create and delete empty tournament', async ({page}) => {
        await dismissModals(page);
        await deleteCurrentTournament(page);
        await expect(page.locator('[data-testid="tournament-name-row"]')).toBeVisible();
    });

    test('rename tournament inline', async ({page}) => {
        await ensureCleanTournament(page);
        await page.locator('[data-testid="tournament-name-row"] strong').click();
        const input = page.locator('.inline-name-input');
        await expect(input).toBeVisible();
        await input.fill('My Test Tournament');
        await page.locator('.inline-name-btn--save').click();
        await expect(page.locator('text=My Test Tournament')).toBeVisible();
        await deleteCurrentTournament(page);
    });

    test('restore round requires confirmation', async ({page}) => {
        await ensureCleanTournament(page);
        await addTeams(page, 8);
        await drawFirstRound(page);
        await playRound(page);

        const restoreLink = page.locator('[data-testid="link-restore-round"]');
        await expect(restoreLink).toBeVisible();
        await restoreLink.click();
        await expect(page.locator('.confirm-remove__btn--danger')).toBeVisible();
        await page.locator('.confirm-remove__btn--danger').click();
        await expect(page.locator('.game-row').first()).toBeVisible();
        await deleteCurrentTournament(page);
    });

    test('delete from preferences in started tournament', async ({page}) => {
        await ensureCleanTournament(page);
        await addTeams(page, 6);
        await drawFirstRound(page);
        await playRound(page);

        await page.locator('[data-testid="btn-preferences"]').click();
        const removeBtn = page.locator('[data-testid="btn-remove-tournament"]');
        await removeBtn.waitFor({state: 'visible'});
        await removeBtn.click();
        await page.locator('[data-testid="btn-confirm-remove"]').click();
        await page.waitForTimeout(500);
        await expect(page.locator('[data-testid="tournament-name-row"]')).toBeVisible();
    });
});
