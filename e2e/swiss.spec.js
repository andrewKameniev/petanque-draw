import { test, expect } from '@playwright/test';
import {
    ensureCleanTournament,
    addTeams,
    selectSystem,
    drawFirstRound,
    playRound,
    playMultipleRounds,
    goToPlayOff,
    goToCadrage,
    clickFinishTournament,
    deleteCurrentTournament,
    deleteAllTournaments,
    enablePlayOff,
    enableCadrage,
    enablePlayB,
    setPlayOffTeams,
    fillCadrageScores,
    saveCadrageAndStartPlayOff,
    playEntirePlayoff,
} from './helpers';

test.describe('Swiss System Tournaments', () => {
    test.beforeEach(async ({ page }) => {
        await ensureCleanTournament(page);
    });

    test('4 teams — supermele, 2 rounds, finish', async ({ page }) => {
        await addTeams(page, 4);
        await selectSystem(page, 'supermele');
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 1);
        await clickFinishTournament(page);
        await deleteCurrentTournament(page);
    });

    test('8 teams — 3 rounds swiss, finish', async ({ page }) => {
        await addTeams(page, 8);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 2);
        await clickFinishTournament(page);
        await deleteCurrentTournament(page);
    });

    test('8 teams — swiss + playoff (top 4) full bracket to winner', async ({ page }) => {
        await addTeams(page, 8);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 4);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 2);
        await goToPlayOff(page);
        await expect(page.locator('[data-testid="playoff-stage-heading"]')).toBeVisible();
        // 4 teams: semifinal (1/2) → final → finished
        await playEntirePlayoff(page);
        await expect(page.locator('[data-testid="finished-banner"]')).toBeVisible();
        await deleteCurrentTournament(page);
    });

    test('8 teams — swiss + cadrage + playoff (top 4) full bracket', async ({ page }) => {
        await addTeams(page, 8);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 4);
        await enableCadrage(page);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 2);
        await goToCadrage(page);
        await fillCadrageScores(page);
        await saveCadrageAndStartPlayOff(page);
        await expect(page.locator('[data-testid="playoff-stage-heading"]')).toBeVisible();
        await playEntirePlayoff(page);
        await expect(page.locator('[data-testid="finished-banner"]')).toBeVisible();
        await deleteCurrentTournament(page);
    });

    test('16 teams — swiss + playoff (top 8) full bracket to winner', async ({ page }) => {
        await addTeams(page, 16);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 8);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 3);
        await goToPlayOff(page);
        // 8 teams: 1/4 → 1/2 → final → finished
        await playEntirePlayoff(page);
        await expect(page.locator('[data-testid="finished-banner"]')).toBeVisible();
        await deleteCurrentTournament(page);
    });

    test('16 teams — swiss + cadrage + playoff (top 8) full bracket', async ({ page }) => {
        await addTeams(page, 16);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 8);
        await enableCadrage(page);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 3);
        await goToCadrage(page);
        await fillCadrageScores(page);
        await saveCadrageAndStartPlayOff(page);
        await playEntirePlayoff(page);
        await expect(page.locator('[data-testid="finished-banner"]')).toBeVisible();
        await deleteCurrentTournament(page);
    });

    test('40 teams — swiss + playoff (top 16) full bracket', async ({ page }) => {
        test.setTimeout(60000);
        await addTeams(page, 40);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 16);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 4);
        await goToPlayOff(page);
        // 16 teams: 1/8 → 1/4 → 1/2 → final → finished
        await playEntirePlayoff(page);
        await expect(page.locator('[data-testid="finished-banner"]')).toBeVisible();
        await deleteCurrentTournament(page);
    });

    test('40 teams — swiss + cadrage + playoff (top 16) full bracket', async ({ page }) => {
        test.setTimeout(60000);
        await addTeams(page, 40);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 16);
        await enableCadrage(page);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 4);
        await goToCadrage(page);
        await fillCadrageScores(page);
        await saveCadrageAndStartPlayOff(page);
        await playEntirePlayoff(page);
        await expect(page.locator('[data-testid="finished-banner"]')).toBeVisible();
        await deleteCurrentTournament(page);
    });

    test('swiss round limit — cannot draw beyond ceil(log2(N)) rounds', async ({ page }) => {
        await addTeams(page, 8);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 2);
        await expect(page.locator('[data-testid="link-draw-next-round"]')).not.toBeVisible();
        await deleteCurrentTournament(page);
    });

    test('5 teams (odd) — swiss with bye, playoff top 4, full bracket', async ({ page }) => {
        await addTeams(page, 5);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 4);
        await drawFirstRound(page);
        // Odd teams → one game has "Technical" (bye)
        await playRound(page);
        await playMultipleRounds(page, 2);
        await goToPlayOff(page);
        await playEntirePlayoff(page);
        await expect(page.locator('[data-testid="finished-banner"]')).toBeVisible();
        await deleteCurrentTournament(page);
    });

    test('7 teams (odd) — swiss, 3 rounds, finish', async ({ page }) => {
        await addTeams(page, 7);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 2);
        await clickFinishTournament(page);
        await deleteCurrentTournament(page);
    });

    test('8 teams — swiss + playoff + Group B creation', async ({ page }) => {
        await addTeams(page, 8);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 4);
        await enablePlayB(page);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 2);
        await page.locator('[data-testid="btn-go-playoff"]').click();
        await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });
        await page.locator('[data-testid="btn-confirm-playoff"]').click();
        await expect(page.locator('[data-testid="tournament-name-row"] strong')).toContainText('Group B');
        await deleteAllTournaments(page);
    });

    test('16 teams — swiss + cadrage + playoff + Group B', async ({ page }) => {
        test.setTimeout(60000);
        await addTeams(page, 16);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 8);
        await enableCadrage(page);
        await enablePlayB(page);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 3);
        await goToCadrage(page);
        await fillCadrageScores(page);
        await page.locator('[data-testid="btn-save-cadrage"]').click();
        await expect(page.locator('[data-testid="tournament-name-row"] strong')).toContainText('Group B');
        await deleteAllTournaments(page);
    });

    test('playoff confirm — disable cadrage at confirmation', async ({ page }) => {
        await addTeams(page, 8);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 4);
        await enableCadrage(page);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 2);
        // cadrage was enabled during setup, but disable it at confirmation
        await goToPlayOff(page, { cadrage: false });
        await expect(page.locator('[data-testid="playoff-stage-heading"]')).toBeVisible();
        await deleteCurrentTournament(page);
    });

    test('playoff confirm — enable cadrage at confirmation', async ({ page }) => {
        await addTeams(page, 8);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 4);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 2);
        // cadrage was NOT enabled during setup, but enable at confirmation
        await page.locator('[data-testid="btn-go-playoff"]').click();
        await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });
        await page.locator('[data-testid="confirm-cadrage"]').click();
        await page.locator('[data-testid="btn-confirm-playoff"]').click();
        await page.locator('[data-testid="cadrage-heading"]').waitFor({ state: 'visible' });
        await deleteCurrentTournament(page);
    });

    test('playoff confirm — change team count at confirmation', async ({ page }) => {
        await addTeams(page, 16);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 8);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 3);
        // configured for 8, change to 4 at confirmation
        await goToPlayOff(page, { playOffTeams: 4 });
        await expect(page.locator('[data-testid="playoff-stage-heading"]')).toBeVisible();
        // 4 teams = semifinal (1/2), should show 2 games
        const games = page.locator('[data-testid="game-row"]');
        await expect(games).toHaveCount(2);
        await deleteCurrentTournament(page);
    });

    test('playoff confirm — enable Group B at confirmation', async ({ page }) => {
        await addTeams(page, 8);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 4);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 2);
        // Group B was NOT enabled during setup, enable at confirmation
        await goToPlayOff(page, { playB: true });
        await expect(page.locator('[data-testid="tournament-name-row"] strong')).toContainText('Group B');
        await deleteAllTournaments(page);
    });
});
