import {test, expect} from '@playwright/test';
import {
    ensureCleanTournament, addTeams, selectSystem, drawFirstRound,
    playRound, drawNextRound, playMultipleRounds,
    clickFinishTournament, deleteCurrentTournament,
} from './helpers';

test.describe('Groups (Round-Robin) System', () => {
    test.beforeEach(async ({page}) => {
        await ensureCleanTournament(page);
    });

    test('8 teams — 2 groups of 4, full round-robin', async ({page}) => {
        await addTeams(page, 8);
        await selectSystem(page, 'groups');

        const groupSelect = page.locator('.setup-card__select').last();
        await groupSelect.selectOption('4');

        await drawFirstRound(page);
        await expect(page.locator('.game-row').first()).toBeVisible({timeout: 5000});

        await playRound(page);
        await playMultipleRounds(page, 2);

        await clickFinishTournament(page);
        await page.waitForTimeout(500);

        await deleteCurrentTournament(page);
    });

    test('16 teams — 4 groups of 4', async ({page}) => {
        await addTeams(page, 16);
        await selectSystem(page, 'groups');

        const groupSelect = page.locator('.setup-card__select').last();
        await groupSelect.selectOption('4');

        await drawFirstRound(page);
        await expect(page.locator('.game-row').first()).toBeVisible({timeout: 5000});

        await playRound(page);
        await playMultipleRounds(page, 2);

        await clickFinishTournament(page);
        await page.waitForTimeout(500);

        await deleteCurrentTournament(page);
    });

    test('8 teams — 2 groups of 4, then playoff', async ({page}) => {
        await addTeams(page, 8);
        await selectSystem(page, 'groups');

        const groupSelect = page.locator('.setup-card__select').last();
        await groupSelect.selectOption('4');

        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 2);

        const rankingTab = page.locator('a', {hasText: /Ranking|Рейтинг/});
        await rankingTab.click();
        await page.waitForTimeout(300);

        const goBtn = page.locator('button', {hasText: /Go!|Вперед/});
        if (await goBtn.isVisible({timeout: 2000}).catch(() => false)) {
            await goBtn.click();
            await page.waitForTimeout(500);
        }

        await deleteCurrentTournament(page);
    });
});
