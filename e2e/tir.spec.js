import {test, expect} from '@playwright/test';

const TEST_EMAIL = 'e2e-test-petanque@mailinator.com';
const TEST_PASSWORD = 'TestPass123!';

async function login(page) {
    await page.goto('/#/');
    const emailInput = page.locator('[data-testid="input-email"]');
    if (!(await emailInput.isVisible().catch(() => false))) return;
    await emailInput.fill(TEST_EMAIL);
    await page.locator('[data-testid="input-password"]').fill(TEST_PASSWORD);
    await page.locator('[data-testid="btn-submit"]').click();
    await page.locator('[data-testid="tournament-name-row"]').waitFor({state: 'visible'});
}

async function ensureNewTournament(page) {
    await login(page);
    const modal = page.locator('.modal-background');
    if (await modal.isVisible().catch(() => false)) {
        await modal.click({force: true});
        await page.waitForTimeout(200);
    }
    const userBtn = page.locator('.navbar-link__label, .dropdown-trigger button').first();
    await userBtn.click();
    await page.locator('text=Додати новий турнір').click();
    await page.waitForTimeout(300);
}

async function setupTirTournament(page, {teams = 8, twoRounds = false, junior = false} = {}) {
    await ensureNewTournament(page);
    for (let i = 1; i <= teams; i++) {
        await page.locator('[data-testid="input-team-title"]').fill(`Player_${i}`);
        await page.locator('[data-testid="btn-add-team"]').click();
        await page.waitForTimeout(50);
    }
    await page.locator('input[type="radio"][value="tir"]').click();
    if (twoRounds) {
        await page.locator('text=Система з 2 раундами').locator('..').locator('input[type="checkbox"]').check();
    }
    if (junior) {
        await page.locator('text=Юніорський турнір').locator('..').locator('input[type="checkbox"]').check();
    }
    await page.locator('[data-testid="btn-draw-first-round"]').click();
    await page.waitForTimeout(300);
}

async function fillAllScoresViaJS(page, scoresKey = 'scores') {
    await page.evaluate(({scoresKey}) => {
        const app = document.querySelector('#app').__vue_app__;
        const store = app.config.globalProperties.$pinia._s.get('main');
        const tournament = store.currentTournament;
        const participants = tournament.tirParticipants;
        const distances = tournament.tirConfig?.junior ? [6, 7, 8] : [6, 7, 8, 9];
        participants.forEach((p, pIdx) => {
            if (!p[scoresKey]) p[scoresKey] = {};
            for (let a = 0; a < 5; a++) {
                if (!p[scoresKey][a]) p[scoresKey][a] = {};
                distances.forEach((d, dIdx) => {
                    const seed = (pIdx * 20 + a * 4 + dIdx) % 4;
                    const types = ['carreau', 'reussi', 'touche', 'manque'];
                    p[scoresKey][a][d] = types[seed < pIdx % 4 ? 3 : seed];
                });
            }
        });
    }, {scoresKey});
}

test.describe('TIR Tournament', () => {
    test('creates TIR tournament and shows participant list', async ({page}) => {
        await setupTirTournament(page, {teams: 8});
        await expect(page.locator('.tir-scoring__participant-row')).toHaveCount(8);
        await expect(page.locator('.tir-nav__btn--active')).toContainText('Режим');
    });

    test('scoring view shows progress for participant', async ({page}) => {
        await setupTirTournament(page, {teams: 4});
        await page.locator('.tir-scoring__participant-row').first().click();
        await expect(page.locator('.tir-pview__name')).toBeVisible();
        await expect(page.locator('.tir-pview__tab')).toHaveCount(5);
    });

    test('table view shows results after scoring', async ({page}) => {
        await setupTirTournament(page, {teams: 6});
        await fillAllScoresViaJS(page);
        await page.locator('button:has-text("Таблиця")').click();
        await page.waitForTimeout(200);
        const rows = page.locator('.tir-table__content tbody tr');
        await expect(rows).toHaveCount(6);
    });

    test('2-round system: R1 table shows correct labels', async ({page}) => {
        await setupTirTournament(page, {teams: 20, twoRounds: true});
        await fillAllScoresViaJS(page);
        await page.locator('button:has-text("Таблиця")').click();
        await page.waitForTimeout(200);
        await expect(page.locator('text=Напряму').first()).toBeVisible();
        await expect(page.locator('text=→ Раунд 2').first()).toBeVisible();
        await expect(page.locator('text=Вибув').first()).toBeVisible();
    });

    test('2-round system: transition to R2', async ({page}) => {
        await setupTirTournament(page, {teams: 20, twoRounds: true});
        await fillAllScoresViaJS(page);
        await page.locator('button:has-text("Таблиця")').click();
        await page.waitForTimeout(200);
        await page.locator('button:has-text("Почати раунд 2")').click();
        await page.waitForTimeout(300);
        await expect(page.locator('.tir-nav__round-badge')).toContainText('R2');
    });

    test('2-round system: start playoff after R2', async ({page}) => {
        await setupTirTournament(page, {teams: 20, twoRounds: true});
        await fillAllScoresViaJS(page, 'scores');
        await page.locator('button:has-text("Таблиця")').click();
        await page.waitForTimeout(200);
        await page.locator('button:has-text("Почати раунд 2")').click();
        await page.waitForTimeout(300);
        await fillAllScoresViaJS(page, 'scores2');
        await page.locator('button:has-text("Таблиця")').click();
        await page.waitForTimeout(200);
        await page.locator('button:has-text("Почати плей-офф")').click();
        await page.waitForTimeout(300);
        await expect(page.locator('button:has-text("Плей офф")')).toBeVisible();
    });

    test('playoff match opens comparison view', async ({page}) => {
        await setupTirTournament(page, {teams: 8});
        await fillAllScoresViaJS(page);
        await page.locator('button:has-text("Таблиця")').click();
        await page.waitForTimeout(200);
        await page.locator('button:has-text("Почати плей-офф")').click();
        await page.waitForTimeout(300);
        const match = page.locator('.tir-playoff__match').first();
        await match.click();
        await expect(page.locator('.tir-pmatch__overview')).toBeVisible();
        await expect(page.locator('.tir-pmatch__atelier')).toHaveCount(5);
    });

    test('junior mode uses 3 distances', async ({page}) => {
        await setupTirTournament(page, {teams: 4, junior: true});
        await page.locator('.tir-scoring__participant-row').first().click();
        page.locator('.tir-pview__grid-row .tir-pview__grid-distance, .tir-pview__grid-row div:first-child');
        await expect(page.locator('.tir-pview__throws')).toContainText('/ 15');
    });
});
