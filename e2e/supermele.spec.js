import {test, expect} from '@playwright/test';
import {
    ensureCleanTournament, addTeams, selectSystem, drawFirstRound,
    playRound, drawNextRound, playMultipleRounds,
    clickFinishTournament, deleteCurrentTournament,
} from './helpers';

test.describe('Supermele System', () => {
    test.beforeEach(async ({page}) => {
        await ensureCleanTournament(page);
    });

    test('8 players — doubles, 3 rounds', async ({page}) => {
        await addTeams(page, 8);
        await selectSystem(page, 'supermele');

        await drawFirstRound(page);
        await expect(page.locator('.game-row').first()).toBeVisible({timeout: 5000});

        await playRound(page);
        await playMultipleRounds(page, 2);

        await clickFinishTournament(page);
        await page.waitForTimeout(500);

        await deleteCurrentTournament(page);
    });

    test('9 players — triples, 3 rounds', async ({page}) => {
        await addTeams(page, 9);
        await selectSystem(page, 'supermele');

        const playersSelect = page.locator('select').filter({has: page.locator('option[value="3"]')}).last();
        await playersSelect.selectOption('3');

        await drawFirstRound(page);
        await expect(page.locator('.game-row').first()).toBeVisible({timeout: 5000});

        await playRound(page);
        await playMultipleRounds(page, 2);

        await clickFinishTournament(page);
        await page.waitForTimeout(500);

        await deleteCurrentTournament(page);
    });

    test('16 players — doubles, 4 rounds', async ({page}) => {
        await addTeams(page, 16);
        await selectSystem(page, 'supermele');

        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 3);

        await clickFinishTournament(page);
        await page.waitForTimeout(500);

        await deleteCurrentTournament(page);
    });

    test('can add teams mid-tournament in supermele', async ({page}) => {
        await addTeams(page, 6);
        await selectSystem(page, 'supermele');
        await drawFirstRound(page);
        await playRound(page);

        const teamsTab = page.locator('a', {hasText: /Teams|Команди/});
        await teamsTab.click();
        await page.waitForTimeout(300);

        await page.locator('input[placeholder*="Team title"], input[placeholder*="Назва"]').fill('LatePlayer');
        await page.locator('button', {hasText: /Add team|Додати/}).click();
        await page.waitForTimeout(300);

        const gamesTab = page.locator('a', {hasText: /Current games|Поточні ігри/});
        await gamesTab.click();
        await page.waitForTimeout(300);

        await drawNextRound(page);
        await expect(page.locator('.games-list, .game-row')).toBeVisible({timeout: 3000});

        await deleteCurrentTournament(page);
    });
});
