const TEST_EMAIL = 'e2e-test-petanque@mailinator.com';
const TEST_PASSWORD = 'TestPass123!';
const BASE_URL = 'http://localhost:5173';

async function register(page) {
    await page.goto('/#/');
    const signUpLink = page.locator('a', {hasText: 'Sign up'});
    if (await signUpLink.isVisible()) {
        await signUpLink.click();
    }
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('input[placeholder="Confirm password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]', {hasText: 'Sign up'}).click();
    await page.waitForSelector('.tournament-name-row', {timeout: 15000});
}

async function login(page) {
    await page.goto('/#/');
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible({timeout: 3000}).catch(() => false)) {
        await emailInput.fill(TEST_EMAIL);
        await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
        await page.locator('button[type="submit"]', {hasText: 'Sign in'}).click();
        await page.waitForSelector('.tournament-name-row', {timeout: 15000});
    }
}

async function ensureLoggedIn(page) {
    await page.goto('/#/');
    const hasTournament = await page.locator('.tournament-name-row').isVisible({timeout: 5000}).catch(() => false);
    if (!hasTournament) {
        await login(page);
    }
}

async function ensureCleanTournament(page) {
    await ensureLoggedIn(page);

    const teamInput = page.locator('input[placeholder*="Team title"], input[placeholder*="Назва"]');
    const hasTabs = await page.locator('a', {hasText: /Current games|Поточні ігри/}).isVisible({timeout: 1000}).catch(() => false);
    const hasTeamRows = await page.locator('table tr td').first().isVisible({timeout: 500}).catch(() => false);

    if (!hasTabs && !hasTeamRows && await teamInput.isVisible({timeout: 1000}).catch(() => false)) {
        return;
    }

    await deleteAllTournaments(page);
    await page.waitForTimeout(500);

    const ready = await teamInput.isVisible({timeout: 3000}).catch(() => false);
    if (!ready) {
        await page.goto('/#/');
        await page.waitForTimeout(2000);
    }
}

async function addTeams(page, count) {
    const names = generateTeamNames(count);
    for (const name of names) {
        await page.locator('input[placeholder*="Team title"], input[placeholder*="Назва"]').fill(name);
        await page.locator('button', {hasText: /Add team|Додати/}).click();
        await page.waitForTimeout(200);
    }
    return names;
}

function generateTeamNames(count) {
    const names = [];
    for (let i = 1; i <= count; i++) {
        names.push(`Team_${i}`);
    }
    return names;
}

async function selectSystem(page, system) {
    await page.locator(`input[type="radio"][value="${system}"]`).click();
}

async function drawFirstRound(page) {
    await page.locator('button', {hasText: /Draw first round|Жеребкувати/}).click();
    await page.locator('.game-row').first().waitFor({state: 'visible', timeout: 10000});
}

async function fillRandomScores(page, maxScore = 13) {
    const scoreInputs = page.locator('.game-row input[type="number"]:not([disabled])');
    await scoreInputs.first().waitFor({state: 'visible', timeout: 10000});
    const count = await scoreInputs.count();
    for (let i = 0; i < count; i += 2) {
        const score1 = Math.floor(Math.random() * (maxScore - 2)) + 2;
        let score2;
        do {
            score2 = Math.floor(Math.random() * (maxScore - 1));
        } while (score2 === score1);
        await scoreInputs.nth(i).click();
        await scoreInputs.nth(i).fill(String(score1));
        await scoreInputs.nth(i + 1).click();
        await scoreInputs.nth(i + 1).fill(String(score2));
    }
    await page.waitForTimeout(200);
}

async function saveResults(page) {
    const saveBtn = page.locator('button:has-text("Save results"), button:has-text("Зберегти результати")').first();
    await saveBtn.waitFor({state: 'visible', timeout: 5000});
    await saveBtn.click();
    await page.waitForTimeout(800);
}

async function drawNextRound(page) {
    const drawLink = page.locator('.draw-card__link--draw');
    await drawLink.waitFor({state: 'visible', timeout: 10000});
    await drawLink.click();
    await page.locator('.game-row input[type="number"]:not([disabled])').first().waitFor({state: 'visible', timeout: 10000});
}

async function playRound(page) {
    await fillRandomScores(page);
    await saveResults(page);
}

async function playMultipleRounds(page, rounds) {
    for (let i = 1; i < rounds; i++) {
        await drawNextRound(page);
        await playRound(page);
    }
}

async function goToPlayOff(page) {
    const goPlayOffBtn = page.locator('.bottom-actions__btn--finish', {hasText: /Go to play-off|Перейти до плей-оф/});
    if (await goPlayOffBtn.isVisible({timeout: 2000}).catch(() => false)) {
        await goPlayOffBtn.click();
        await page.waitForTimeout(500);
    }
}

async function clickFinishTournament(page) {
    const finishBtn = page.locator('.bottom-actions__btn--outline', {hasText: /Finish tournament|Завершити турнір/});
    await finishBtn.click();
    await page.waitForTimeout(500);
}

async function deleteTournament(page) {
    const prefsBtn = page.locator('button', {hasText: /Preferences|Налаштування/});
    if (await prefsBtn.isVisible({timeout: 2000}).catch(() => false)) {
        await prefsBtn.click();
        await page.waitForTimeout(300);
    }
    const removeBtn = page.locator('button', {hasText: /Remove tournament|Видалити турнір/});
    if (await removeBtn.isVisible({timeout: 2000}).catch(() => false)) {
        await removeBtn.click();
        await page.waitForTimeout(300);
        const confirmBtn = page.locator('.confirm-remove__btn--danger');
        await confirmBtn.waitFor({state: 'visible', timeout: 3000});
        await confirmBtn.click();
        await page.waitForTimeout(500);
    }
}

async function deleteCurrentTournament(page) {
    const dangerBtn = page.locator('.bottom-actions__btn--danger');
    if (await dangerBtn.isVisible({timeout: 2000}).catch(() => false)) {
        await dangerBtn.click();
        await page.waitForTimeout(300);
        const confirmBtn = page.locator('.confirm-remove__btn--danger');
        const hasConfirm = await confirmBtn.isVisible({timeout: 2000}).catch(() => false);
        if (hasConfirm) {
            await confirmBtn.click();
            await page.waitForTimeout(500);
            return;
        }
    }
    await deleteTournament(page);
}

async function deleteAllTournaments(page) {
    for (let i = 0; i < 10; i++) {
        const hasTournament = await page.locator('.tournament-name-row').isVisible({timeout: 2000}).catch(() => false);
        if (!hasTournament) break;
        await deleteCurrentTournament(page);
        await page.waitForTimeout(500);
    }
}

async function setPlayOffTeams(page, count) {
    const select = page.locator('select').filter({has: page.locator(`option[value="${count}"]`)}).last();
    await select.selectOption(String(count));
}

async function enablePlayOff(page) {
    const checkbox = page.locator('label', {hasText: /Play-off after Swiss|Плей-оф після швейцарських/}).locator('input[type="checkbox"]');
    if (!(await checkbox.isChecked())) {
        await checkbox.click();
    }
}

async function enableCadrage(page) {
    const checkbox = page.locator('label', {hasText: /cadrage|кадраж/i}).locator('input[type="checkbox"]');
    if (!(await checkbox.isChecked())) {
        await checkbox.click();
    }
}

async function fillCadrageScores(page) {
    const scoreInputs = page.locator('input[type="number"]');
    const count = await scoreInputs.count();
    for (let i = 0; i < count; i += 2) {
        const score1 = 13;
        const score2 = Math.floor(Math.random() * 12);
        await scoreInputs.nth(i).fill(String(score1));
        await scoreInputs.nth(i + 1).fill(String(score2));
    }
}

async function saveCadrageAndStartPlayOff(page) {
    const saveBtn = page.locator('button', {hasText: /Save results|Зберегти результати/});
    await saveBtn.click();
    await page.waitForTimeout(1000);
}

export {
    TEST_EMAIL,
    TEST_PASSWORD,
    BASE_URL,
    register,
    login,
    ensureLoggedIn,
    ensureCleanTournament,
    addTeams,
    generateTeamNames,
    selectSystem,
    drawFirstRound,
    fillRandomScores,
    saveResults,
    drawNextRound,
    playRound,
    playMultipleRounds,
    goToPlayOff,
    clickFinishTournament,
    deleteTournament,
    deleteCurrentTournament,
    deleteAllTournaments,
    setPlayOffTeams,
    enablePlayOff,
    enableCadrage,
    fillCadrageScores,
    saveCadrageAndStartPlayOff,
};
