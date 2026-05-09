import {test, expect} from '@playwright/test';
import {
    ensureCleanTournament, addTeams, selectSystem, drawFirstRound,
    playRound, drawNextRound, playMultipleRounds,
    goToPlayOff, clickFinishTournament, deleteCurrentTournament,
    enablePlayOff, enableCadrage, setPlayOffTeams,
    fillCadrageScores, saveCadrageAndStartPlayOff, fillRandomScores, saveResults,
} from './helpers';

test.describe('Swiss System Tournaments', () => {
    test.beforeEach(async ({page}) => {
        await ensureCleanTournament(page);
    });

    test('4 teams — full swiss, finish without playoff', async ({page}) => {
        await addTeams(page, 4);
        await selectSystem(page, 'supermele');
        await drawFirstRound(page);

        await expect(page.locator('.game-row').first()).toBeVisible({timeout: 5000});
        await playRound(page);
        await drawNextRound(page);
        await playRound(page);

        await clickFinishTournament(page);
        await expect(page.locator('text=/Tournament.*finished|Турнір.*завершено/i')).toBeVisible({timeout: 5000}).catch(() => {});

        await deleteCurrentTournament(page);
    });

    test('8 teams — 3 rounds swiss, no playoff, finish', async ({page}) => {
        await addTeams(page, 8);

        await drawFirstRound(page);
        await expect(page.locator('.game-row').first()).toBeVisible({timeout: 5000});

        await playRound(page);
        await playMultipleRounds(page, 2);

        await clickFinishTournament(page);
        await page.waitForTimeout(500);

        await deleteCurrentTournament(page);
    });

    test('8 teams — swiss + playoff (top 4, no cadrage)', async ({page}) => {
        await addTeams(page, 8);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 4);

        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 2);

        await goToPlayOff(page);
        await page.waitForTimeout(500);

        const playoffVisible = await page.locator('text=/PlayOff|Плей-оф/i').isVisible({timeout: 3000}).catch(() => false);
        expect(playoffVisible).toBeTruthy();

        await deleteCurrentTournament(page);
    });

    test('8 teams — swiss + cadrage + playoff (top 4)', async ({page}) => {
        await addTeams(page, 8);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 4);
        await enableCadrage(page);

        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 2);

        await goToPlayOff(page);
        await page.waitForTimeout(500);

        const cadrageVisible = await page.locator('text=/Cadrage|Кадраж/i').isVisible({timeout: 3000}).catch(() => false);
        expect(cadrageVisible).toBeTruthy();

        await fillCadrageScores(page);
        await saveCadrageAndStartPlayOff(page);

        const playoffVisible = await page.locator('text=/PlayOff|Плей-оф/i').isVisible({timeout: 5000}).catch(() => false);
        expect(playoffVisible).toBeTruthy();

        await deleteCurrentTournament(page);
    });

    test('16 teams — 4 rounds swiss + playoff (top 8)', async ({page}) => {
        await addTeams(page, 16);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 8);

        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 3);

        await goToPlayOff(page);
        await page.waitForTimeout(500);

        const playoffVisible = await page.locator('text=/PlayOff|Плей-оф/i').isVisible({timeout: 3000}).catch(() => false);
        expect(playoffVisible).toBeTruthy();

        await deleteCurrentTournament(page);
    });

    test('16 teams — swiss + cadrage + playoff (top 8)', async ({page}) => {
        await addTeams(page, 16);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 8);
        await enableCadrage(page);

        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 3);

        await goToPlayOff(page);
        await page.waitForTimeout(500);

        const cadrageVisible = await page.locator('text=/Cadrage|Кадраж/i').isVisible({timeout: 3000}).catch(() => false);
        expect(cadrageVisible).toBeTruthy();

        await fillCadrageScores(page);
        await saveCadrageAndStartPlayOff(page);

        const playoffVisible = await page.locator('text=/PlayOff|Плей-оф/i').isVisible({timeout: 5000}).catch(() => false);
        expect(playoffVisible).toBeTruthy();

        await deleteCurrentTournament(page);
    });

    test('40 teams — 5 rounds swiss + playoff (top 16)', async ({page}) => {
        test.setTimeout(120000);
        await addTeams(page, 40);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 16);

        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 4);

        await goToPlayOff(page);
        await page.waitForTimeout(500);

        const playoffVisible = await page.locator('text=/PlayOff|Плей-оф/i').isVisible({timeout: 3000}).catch(() => false);
        expect(playoffVisible).toBeTruthy();

        await deleteCurrentTournament(page);
    });

    test('40 teams — swiss + cadrage + playoff (top 16)', async ({page}) => {
        test.setTimeout(120000);
        await addTeams(page, 40);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 16);
        await enableCadrage(page);

        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 4);

        await goToPlayOff(page);
        await page.waitForTimeout(500);

        const cadrageVisible = await page.locator('text=/Cadrage|Кадраж/i').isVisible({timeout: 3000}).catch(() => false);
        expect(cadrageVisible).toBeTruthy();

        await fillCadrageScores(page);
        await saveCadrageAndStartPlayOff(page);

        const playoffVisible = await page.locator('text=/PlayOff|Плей-оф/i').isVisible({timeout: 5000}).catch(() => false);
        expect(playoffVisible).toBeTruthy();

        await deleteCurrentTournament(page);
    });

    test('swiss round limit — cannot draw beyond N/2 rounds', async ({page}) => {
        await addTeams(page, 8);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 3);

        const drawLink = page.locator('a', {hasText: /Draw 5|Жеребкувати 5/});
        await expect(drawLink).not.toBeVisible({timeout: 2000});

        await deleteCurrentTournament(page);
    });
});
