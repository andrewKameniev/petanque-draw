import {expect} from '@playwright/test';
const TEST_EMAIL = 'e2e-test-petanque@mailinator.com';
const TEST_PASSWORD = 'TestPass123!';

// --- Auth flows ---

async function login(page) {
    await page.goto('/#/');
    const emailInput = page.locator('[data-testid="input-email"]');
    if (!(await emailInput.isVisible().catch(() => false))) return;
    await emailInput.fill(TEST_EMAIL);
    await page.locator('[data-testid="input-password"]').fill(TEST_PASSWORD);
    await page.locator('[data-testid="btn-submit"]').click();
    await page.locator('[data-testid="tournament-name-row"]').waitFor({state: 'visible'});
}

async function register(page) {
    await page.goto('/#/');
    const toggleLink = page.locator('[data-testid="link-toggle-auth"]');
    if (await toggleLink.isVisible()) await toggleLink.click();
    await page.locator('[data-testid="input-email"]').fill(TEST_EMAIL);
    await page.locator('[data-testid="input-password"]').fill(TEST_PASSWORD);
    await page.locator('[data-testid="input-password-confirm"]').fill(TEST_PASSWORD);
    await page.locator('[data-testid="btn-submit"]').click();
    await page.locator('[data-testid="tournament-name-row"]').waitFor({state: 'visible'});
}

// --- Tournament setup flows ---

async function ensureCleanTournament(page) {
    await login(page);
    await dismissModals(page);
    for (let i = 0; i < 5; i++) {
        const started = await page.locator('[data-testid="btn-preferences"]').isVisible().catch(() => false);
        const hasTeams = await page.locator('table tr td').first().isVisible().catch(() => false);
        if (!started && !hasTeams) break;
        await deleteCurrentTournament(page);
        await page.waitForTimeout(300);
    }
}

async function addTeams(page, count) {
    const input = page.locator('[data-testid="input-team-title"]');
    const btn = page.locator('[data-testid="btn-add-team"]');
    for (let i = 1; i <= count; i++) {
        await input.fill(`Team_${i}`);
        await btn.click();
        await page.waitForTimeout(100);
    }
}

async function importTeamsFromPortal(page, portalId) {
    await page.locator('[data-testid="input-portal-id"]').fill(String(portalId));
    await page.locator('[data-testid="btn-import-portal"]').click();
    await page.locator('table tr td').first().waitFor({state: 'visible'});
}

async function selectSystem(page, system) {
    await page.locator(`input[type="radio"][value="${system}"]`).click();
}

async function enablePlayOff(page) {
    const checkbox = page.locator('[data-testid="checkbox-playoff"]');
    if (!(await checkbox.isChecked())) await checkbox.click();
    await page.locator('[data-testid="select-playoff-teams"]').waitFor({state: 'visible'});
    const cadrage = page.locator('[data-testid="checkbox-cadrage"]');
    if (await cadrage.isChecked()) await cadrage.click();
}

async function enableCadrage(page) {
    const checkbox = page.locator('[data-testid="checkbox-cadrage"]');
    if (!(await checkbox.isChecked())) await checkbox.click();
}

async function enablePlayB(page) {
    const checkbox = page.locator('[data-testid="checkbox-play-b"]');
    if (!(await checkbox.isChecked())) await checkbox.click();
}

async function setPlayOffTeams(page, count) {
    await page.locator('[data-testid="select-playoff-teams"]').selectOption(String(count));
}

async function setTeamsInGroup(page, count) {
    await page.locator('[data-testid="select-teams-in-group"]').selectOption(String(count));
}

// --- Game flows ---

async function drawFirstRound(page) {
    await page.locator('[data-testid="btn-draw-first-round"]').click();
    await page.locator('[data-testid="game-row"]').first().waitFor({state: 'visible'});
}

async function fillScores(page) {
    await page.locator('[data-testid="game-row"]').first().waitFor({state: 'visible'});
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
}

async function saveResults(page) {
    await page.locator('[data-testid="btn-save-results"]').click();
    await page.locator('[data-testid="link-draw-next-round"], [data-testid="btn-go-playoff"], [data-testid="btn-finish-tournament"]').first().waitFor({state: 'visible'});
}

async function playRound(page) {
    await fillScores(page);
    await saveResults(page);
}

async function drawNextRound(page) {
    await page.locator('[data-testid="link-draw-next-round"]').click();
    await page.locator('[data-testid="game-row"]').first().waitFor({state: 'visible'});
}

async function playMultipleRounds(page, rounds) {
    for (let i = 0; i < rounds; i++) {
        await drawNextRound(page);
        await playRound(page);
    }
}

// --- Transition flows ---

async function goToPlayOff(page, {playOffTeams, cadrage, playB} = {}) {
    await page.locator('[data-testid="btn-go-playoff"]').click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({state: 'visible'});
    if (playOffTeams) {
        await page.locator('[data-testid="confirm-playoff-teams"]').selectOption(String(playOffTeams));
    }
    if (cadrage === true) {
        const cb = page.locator('[data-testid="confirm-cadrage"]');
        if (!(await cb.isChecked())) await cb.click();
    } else if (cadrage === false) {
        const cb = page.locator('[data-testid="confirm-cadrage"]');
        if (await cb.isChecked()) await cb.click();
    }
    if (playB === true) {
        const cb = page.locator('[data-testid="confirm-play-b"]');
        if (!(await cb.isChecked())) await cb.click();
    } else if (playB === false) {
        const cb = page.locator('[data-testid="confirm-play-b"]');
        if (await cb.isChecked()) await cb.click();
    }
    await page.locator('[data-testid="btn-confirm-playoff"]').click();
    if (playB) {
        await expect(page.locator('[data-testid="tournament-name-row"] strong')).toContainText('Group B');
    } else {
        await page.locator('[data-testid="playoff-wrapper"]').waitFor({state: 'visible'});
    }
}

async function goToCadrage(page) {
    await page.locator('[data-testid="btn-go-playoff"]').click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({state: 'visible'});
    await page.locator('[data-testid="btn-confirm-playoff"]').click();
    await page.locator('[data-testid="cadrage-heading"]').waitFor({state: 'visible'});
}

async function fillCadrageScores(page) {
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
}

async function saveCadrageAndStartPlayOff(page) {
    await page.locator('[data-testid="btn-save-cadrage"]').click();
    await page.locator('[data-testid="playoff-wrapper"]').waitFor({state: 'visible'});
}

async function fillPlayoffScores(page) {
    await page.locator('[data-testid="game-row"]').first().waitFor({state: 'visible'});
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
}

async function savePlayoffResults(page) {
    await page.locator('[data-testid="btn-save-playoff"]').click();
}

async function playPlayoffRound(page) {
    await fillPlayoffScores(page);
    await savePlayoffResults(page);
}

async function playEntirePlayoff(page) {
    const heading = page.locator('[data-testid="playoff-stage-heading"]');
    await heading.waitFor({state: 'visible'});
    while (await heading.isVisible().catch(() => false)) {
        await playPlayoffRound(page);
        await page.waitForTimeout(300);
    }
    await page.locator('[data-testid="finished-banner"]').waitFor({state: 'visible'});
}

async function clickFinishTournament(page) {
    await page.locator('[data-testid="btn-finish-tournament"]').click();
    await page.locator('[data-testid="btn-confirm-finish"]').click();
    await page.locator('[data-testid="finished-banner"]').waitFor({state: 'visible'});
}

// --- Cleanup flows ---

async function dismissModals(page) {
    const modal = page.locator('.modal-background');
    if (await modal.isVisible().catch(() => false)) {
        await modal.click({force: true});
        await page.waitForTimeout(200);
    }
}

async function deleteCurrentTournament(page) {
    await dismissModals(page);
    const setupDelete = page.locator('[data-testid="btn-delete-setup"]');
    if (await setupDelete.isVisible().catch(() => false)) {
        await setupDelete.click();
        await page.locator('[data-testid="btn-confirm-remove"]').click();
        await page.waitForTimeout(300);
        return;
    }
    const prefsBtn = page.locator('[data-testid="btn-preferences"]');
    if (await prefsBtn.isVisible().catch(() => false)) {
        await prefsBtn.click();
        const removeBtn = page.locator('[data-testid="btn-remove-tournament"]');
        await removeBtn.waitFor({state: 'visible'});
        await removeBtn.click();
        await page.locator('[data-testid="btn-confirm-remove"]').click();
        await page.waitForTimeout(300);
    }
}

async function deleteAllTournaments(page) {
    for (let i = 0; i < 12; i++) {
        const hasRow = await page.locator('[data-testid="tournament-name-row"]').isVisible().catch(() => false);
        if (!hasRow) break;
        await deleteCurrentTournament(page);
    }
}

export {
    TEST_EMAIL,
    TEST_PASSWORD,
    register,
    login,
    ensureCleanTournament,
    addTeams,
    importTeamsFromPortal,
    selectSystem,
    enablePlayOff,
    enableCadrage,
    enablePlayB,
    setPlayOffTeams,
    setTeamsInGroup,
    drawFirstRound,
    fillScores,
    saveResults,
    drawNextRound,
    playRound,
    playMultipleRounds,
    goToPlayOff,
    goToCadrage,
    fillCadrageScores,
    saveCadrageAndStartPlayOff,
    fillPlayoffScores,
    savePlayoffResults,
    playPlayoffRound,
    playEntirePlayoff,
    clickFinishTournament,
    dismissModals,
    deleteCurrentTournament,
    deleteAllTournaments,
};
