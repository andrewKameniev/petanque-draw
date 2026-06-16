import {test, expect} from '@playwright/test';
import {
    addTeams, drawFirstRound, goToPlayOff, goToCadrage,
    fillCadrageScores, saveCadrageAndStartPlayOff,
    fillPlayoffScores, savePlayoffResults, playPlayoffRound,
    playEntirePlayoff, deleteCurrentTournament,
    enablePlayOff, enableCadrage, setPlayOffTeams, login, dismissModals,
} from './helpers';

async function fillScoresAndFinish(page) {
    const finishBtn = page.locator('[data-testid="btn-finish-round"]');
    await finishBtn.waitFor({state: 'visible', timeout: 15000});
    await page.evaluate(() => {
        document.querySelectorAll('input[id^="team_"]').forEach((input) => {
            input.value = 13;
            input.dispatchEvent(new Event('input', {bubbles: true}));
        });
        document.querySelectorAll('input[id^="opponent_"]').forEach((input) => {
            input.value = Math.floor(Math.random() * 13);
            input.dispatchEvent(new Event('input', {bubbles: true}));
        });
    });
    // Re-locate after evaluate to avoid detached DOM issues
    await page.waitForTimeout(200);
    await page.locator('[data-testid="btn-finish-round"]').click({timeout: 15000});
    await page.locator('[data-testid="link-draw-next-round"], [data-testid="btn-go-playoff"], [data-testid="btn-finish-tournament"]').first().waitFor({state: 'visible', timeout: 15000});
}

async function ensureRoundActive(page) {
    // Handle Firebase race: after draw, roundIsActive might get reset by sync.
    // Wait for either btn-finish-round (round active) or start-round link (round reset)
    const finishBtn = page.locator('[data-testid="btn-finish-round"]');
    const startLink = page.getByRole('link', {name: /Старт раунд|Start round/i});
    await finishBtn.or(startLink).waitFor({state: 'visible', timeout: 15000});
    if (await startLink.isVisible().catch(() => false)) {
        await startLink.click();
        await finishBtn.waitFor({state: 'visible', timeout: 10000});
    }
}

async function playSwissRounds(page, totalRounds) {
    await drawFirstRound(page);
    await ensureRoundActive(page);
    await fillScoresAndFinish(page);
    for (let i = 1; i < totalRounds; i++) {
        await page.locator('[data-testid="link-draw-next-round"]').click();
        await ensureRoundActive(page);
        await fillScoresAndFinish(page);
    }
}

async function forceDeleteAll(page) {
    for (let i = 0; i < 12; i++) {
        // Check if we have a tournament loaded (by presence of nav tabs or setup screen)
        const hasTournament = await page.locator('[data-testid="tournament-name-row"], .tournament-nav__btn--games').first().isVisible().catch(() => false);
        if (!hasTournament) break;
        await dismissModals(page);
        const setupDelete = page.locator('[data-testid="btn-delete-setup"]');
        const prefsBtn = page.locator('[data-testid="btn-preferences"]');
        const removeBtn = page.locator('[data-testid="btn-remove-tournament"]');
        const directDelete = page.getByRole('button', {name: /Видалити турнір|Delete tournament/i});
        if (await setupDelete.isVisible().catch(() => false)) {
            await setupDelete.click();
        } else if (await directDelete.isVisible().catch(() => false)) {
            await directDelete.scrollIntoViewIfNeeded();
            await directDelete.click();
        } else if (await removeBtn.isVisible().catch(() => false)) {
            // Preferences panel already open
            await removeBtn.scrollIntoViewIfNeeded();
            await removeBtn.click();
        } else if (await prefsBtn.isVisible().catch(() => false)) {
            await prefsBtn.scrollIntoViewIfNeeded();
            await prefsBtn.click();
            await removeBtn.waitFor({state: 'visible', timeout: 5000}).catch(() => {});
            if (await removeBtn.isVisible().catch(() => false)) {
                await removeBtn.scrollIntoViewIfNeeded();
                await removeBtn.click();
            } else {
                break;
            }
        } else {
            break;
        }
        const confirmBtn = page.locator('[data-testid="btn-confirm-remove"]');
        await confirmBtn.waitFor({state: 'visible', timeout: 3000}).catch(() => {});
        if (await confirmBtn.isVisible().catch(() => false)) {
            await confirmBtn.click();
        }
        await page.waitForTimeout(500);
    }
}

test.describe('Results Tab — playoff stages visible immediately', () => {
    test.beforeEach(async ({page}) => {
        await login(page);
        // Wait for app to fully load (tournament view or setup screen)
        await page.locator('[data-testid="tournament-name-row"], [data-testid="input-team-title"]').first().waitFor({state: 'visible', timeout: 30000});
        await dismissModals(page);
        await forceDeleteAll(page);
        // After cleanup, app auto-creates a new tournament — wait for setup
        await page.locator('[data-testid="input-team-title"]').waitFor({state: 'visible', timeout: 30000});
    });

    test('8 teams swiss+playoff — results tab shows playoff games before scoring', async ({page}) => {
        test.setTimeout(90000);
        await addTeams(page, 8);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 4);
        await playSwissRounds(page, 3);
        await goToPlayOff(page);

        // Switch to Results tab — playoff should be auto-selected with games visible
        await page.locator('.tournament-nav__btn--results').click();
        await expect(page.locator('.tournament-nav__btn--results')).toHaveClass(/active/);

        // Playoff tab button should be visible
        const playoffBtn = page.locator('.round-tabs button', {hasText: /Плей-оф|Play-off/});
        await expect(playoffBtn.first()).toBeVisible();

        // Playoff section should show games (table view in admin: .playoff-game)
        const playoffGames = page.locator('.playoff-game, .results-card-list .match-item');
        await expect(playoffGames.first()).toBeVisible();

        // Go back to games and play first playoff round
        await page.locator('.tournament-nav__btn--games').click();
        await playPlayoffRound(page);
        await page.waitForTimeout(500);

        // Check results tab shows scored games
        await page.locator('.tournament-nav__btn--results').click();
        const scoredGames = page.locator('.playoff-game, .results-card-list .match-item');
        await expect(scoredGames.first()).toBeVisible();

        await deleteCurrentTournament(page);
    });

    test('8 teams swiss+playoff — final stage visible before scoring', async ({page}) => {
        test.setTimeout(120000);
        await addTeams(page, 8);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 4);
        await playSwissRounds(page, 3);
        await goToPlayOff(page);

        // Play semifinal (1/2)
        await playPlayoffRound(page);
        await page.waitForTimeout(500);

        // Now final stage exists with teams but no scores
        await page.locator('.tournament-nav__btn--results').click();
        const playoffBtn = page.locator('.round-tabs button', {hasText: /Плей-оф|Play-off/});
        await playoffBtn.first().click();

        // Should see both semifinal results AND the final (unscored)
        const stageLabels = page.locator('.playoff-stage-label, .results-card-round-label');
        const labelsCount = await stageLabels.count();
        expect(labelsCount).toBeGreaterThanOrEqual(2);

        await deleteCurrentTournament(page);
    });

    test('16 teams swiss+cadrage+playoff — results shows cadrage and playoff tabs', async ({page}) => {
        test.setTimeout(180000);
        await addTeams(page, 16);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 8);
        await enableCadrage(page);
        await playSwissRounds(page, 4);

        // After swiss rounds: results tab should show round tabs
        await page.locator('.tournament-nav__btn--results').click();
        const roundButtons = page.locator('.round-tabs button');
        await expect(roundButtons.first()).toBeVisible();
        const roundCount = await roundButtons.count();
        expect(roundCount).toBeGreaterThanOrEqual(4);

        // Go to cadrage
        await page.locator('.tournament-nav__btn--games').click();
        await goToCadrage(page);
        await fillCadrageScores(page);
        await saveCadrageAndStartPlayOff(page);

        // Now in playoff: check results tab shows playoff immediately
        await page.locator('.tournament-nav__btn--results').click();
        const playoffBtn = page.locator('.round-tabs button', {hasText: /Плей-оф|Play-off/});
        await expect(playoffBtn.first()).toBeVisible();

        // Should show cadrage tab too
        const cadrageBtn = page.locator('.round-tabs button', {hasText: /Кадраж|Cadrage/});
        await expect(cadrageBtn.first()).toBeVisible();

        // Playoff section should have match items
        await playoffBtn.first().click();
        const matchItems = page.locator('.playoff-game, .results-card-list .match-item');
        await expect(matchItems.first()).toBeVisible();

        await deleteCurrentTournament(page);
    });

    test('8 teams group B playoff — results tab shows playoff for Group B', async ({page}) => {
        test.setTimeout(120000);
        await addTeams(page, 8);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 4);
        await playSwissRounds(page, 3);

        // Go to playoff with Group B in playoff mode
        await page.locator('[data-testid="btn-go-playoff"]').click();
        await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({state: 'visible'});
        const cb = page.locator('[data-testid="confirm-play-b"]');
        if (!(await cb.isChecked())) await cb.click();
        // Expand advanced settings
        await page.locator('[data-testid="playoff-confirm-modal"] .setup-card__collapse-toggle').click();
        await page.waitForTimeout(300);
        // Set Group B mode to playoff
        await page.locator('[data-testid="playoff-confirm-modal"] .confirm-playoff__inline-field select').selectOption('playoff');
        await page.locator('[data-testid="btn-confirm-playoff"]').click();
        // Wait for group switcher to appear (confirms Group B was created)
        await page.locator('.group-switcher__btn').first().waitFor({state: 'visible', timeout: 10000});

        // Switch to Group B
        await page.locator('.group-switcher__btn').last().click();
        await page.waitForTimeout(500);

        // Group B in playoff mode needs to start its playoff
        const startPlayoffLink = page.getByRole('link', {name: /Почати плей-оф|Start playoff/i});
        if (await startPlayoffLink.isVisible().catch(() => false)) {
            await startPlayoffLink.click();
            await page.waitForTimeout(500);
        }

        // Group B should show playoff content
        await page.locator('[data-testid="playoff-wrapper"]').waitFor({state: 'visible', timeout: 10000});

        // Check results tab for Group B
        await page.locator('.tournament-nav__btn--results').click();
        const playoffBtn = page.locator('.round-tabs button', {hasText: /Плей-оф|Play-off/});
        await expect(playoffBtn.first()).toBeVisible();
        await playoffBtn.first().click();

        const matchItems = page.locator('.playoff-game, .results-card-list .match-item');
        await expect(matchItems.first()).toBeVisible();

        // Switch back to Group A — should also show playoff
        await page.locator('.tournament-nav__btn--games').click();
        await page.locator('.group-switcher__btn').first().click();
        await page.waitForTimeout(500);
        await page.locator('.tournament-nav__btn--results').click();
        const playoffBtnA = page.locator('.round-tabs button', {hasText: /Плей-оф|Play-off/});
        await expect(playoffBtnA.first()).toBeVisible();

        await deleteCurrentTournament(page);
    });

    test('public view shows playoff results', async ({page}) => {
        test.setTimeout(120000);
        await addTeams(page, 8);
        await enablePlayOff(page);
        await setPlayOffTeams(page, 4);
        await playSwissRounds(page, 3);
        await goToPlayOff(page);

        // Play first playoff round
        await playPlayoffRound(page);
        await page.waitForTimeout(500);

        // Open QR/link modal to get public URL
        await page.locator('.remote-toolbar__btn').first().click();
        await page.locator('.qr-modal__link').waitFor({state: 'visible', timeout: 5000});
        const publicUrl = await page.locator('.qr-modal__link').getAttribute('href');
        // Close modal
        await page.locator('.modal-background').click({force: true});
        await page.waitForTimeout(300);

        if (publicUrl) {
            await page.goto(publicUrl);
            await page.waitForLoadState('networkidle');

            // Click Results tab on public view
            const resultsTab = page.locator('.tournament-nav__btn--results');
            await expect(resultsTab).toBeVisible({timeout: 10000});
            await resultsTab.click();
            await page.waitForTimeout(500);

            // Should have playoff content
            const matchItems = page.locator('.playoff-game, .results-card-list .match-item');
            await expect(matchItems.first()).toBeVisible();

            // Playoff tab should be auto-selected
            const activeTab = page.locator('.round-tabs button.is-purple');
            await expect(activeTab.first()).toBeVisible();
        }

        // Navigate back to admin to cleanup
        await page.goto('http://localhost:5173/#/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await deleteCurrentTournament(page);
    });
});
