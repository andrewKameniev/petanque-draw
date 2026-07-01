import { test, expect } from '@playwright/test';
import { login, deleteCurrentTournament, addTeams } from './helpers';

async function ensureTrulyClean(page) {
  await login(page);
  const teamInput = page.locator('[data-testid="input-team-title"]');
  const prefsBtn = page.locator('[data-testid="btn-preferences"]');
  await expect(teamInput.or(prefsBtn)).toBeVisible({ timeout: 15000 });
  if (await teamInput.isVisible().catch(() => false)) return;
  await prefsBtn.click();
  await page.locator('[data-testid="btn-remove-tournament"]').click();
  await page.locator('[data-testid="btn-confirm-remove"]').click();
  await teamInput.waitFor({ state: 'visible', timeout: 10000 });
}

async function setupTirTournament(page, { teams = 8, twoRounds = false, junior = false } = {}) {
  await ensureTrulyClean(page);
  await addTeams(page, teams);
  await page.waitForFunction(
    (expected) => {
      const app = document.querySelector('#app')?.__vue_app__;
      if (!app) return false;
      const store = app.config.globalProperties.$pinia._s.get('main');
      const t = store.currentTournament;
      if (!t) return false;
      const active = t.main || t;
      return (active.teams?.length || 0) >= expected;
    },
    teams,
    { timeout: 10000 },
  );
  await page.locator('[data-testid="radio-system-tir"]').waitFor({ state: 'visible' });
  await page.locator('[data-testid="radio-system-tir"]').click({ timeout: 10000 });
  if (twoRounds) {
    await page
      .locator('label', { hasText: /Система з 2/ })
      .locator('input[type="checkbox"]')
      .check();
  }
  if (junior) {
    await page
      .locator('label', { hasText: /Юнацький турнір|Юніорський/ })
      .locator('input[type="checkbox"]')
      .check();
  }
  await page.locator('[data-testid="btn-draw-first-round"]').click();
  await page.waitForTimeout(300);
}

async function fillAllScoresViaJS(page, scoresKey = 'scores') {
  await page.evaluate(
    ({ scoresKey }) => {
      const app = document.querySelector('#app').__vue_app__;
      const store = app.config.globalProperties.$pinia._s.get('main');
      const tournament = store.currentTournament;
      const active = tournament.main || tournament;
      const participants = active.tirParticipants;
      const distances = active.tirConfig?.junior ? [6, 7, 8] : [6, 7, 8, 9];
      const types = ['carreau', 'reussi', 'touche', 'manque'];
      participants.forEach((p, pIdx) => {
        if (!p[scoresKey]) p[scoresKey] = {};
        for (let a = 0; a < 5; a++) {
          if (!p[scoresKey][a]) p[scoresKey][a] = {};
          distances.forEach((d, dIdx) => {
            const slot = a * distances.length + dIdx;
            const threshold = Math.floor((pIdx / participants.length) * 20);
            const typeIdx = slot < threshold ? 3 : (slot + pIdx) % 3;
            p[scoresKey][a][d] = types[typeIdx];
          });
        }
      });
    },
    { scoresKey },
  );
}

test.describe('TIR Tournament', () => {
  test.describe.configure({ timeout: 30000 });

  test.afterEach(async ({ page }) => {
    await deleteCurrentTournament(page);
  });

  test('creates TIR tournament and shows participant list', async ({ page }) => {
    await setupTirTournament(page, { teams: 8 });
    await expect(page.locator('.tir-scoring__participant-row')).toHaveCount(8);
    await expect(page.locator('.tir-nav__btn--active')).toContainText('Рахунок');
  });

  test('scoring view shows progress for participant', async ({ page }) => {
    await setupTirTournament(page, { teams: 4 });
    await page.locator('.tir-scoring__participant-row').first().click();
    await expect(page.locator('.tir-pview__name')).toBeVisible();
    await expect(page.locator('.tir-pview__tab')).toHaveCount(5);
  });

  test('table view shows results after scoring', async ({ page }) => {
    await setupTirTournament(page, { teams: 6 });
    await fillAllScoresViaJS(page);
    await page.locator('button:has-text("Таблиця")').click();
    await page.waitForTimeout(200);
    const rows = page.locator('.tir-table__content tbody tr');
    await expect(rows).toHaveCount(6);
  });

  test('2-round system: R1 table shows correct labels', async ({ page }) => {
    await setupTirTournament(page, { teams: 20, twoRounds: true });
    await fillAllScoresViaJS(page);
    await page.locator('button:has-text("Таблиця")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('text=Напряму').first()).toBeVisible();
    await expect(page.locator('text=→ Раунд 2').first()).toBeVisible();
    const rows = page.locator('.tir-table__content tbody tr');
    await expect(rows).toHaveCount(20);
  });

  test('2-round system: transition to R2', async ({ page }) => {
    await setupTirTournament(page, { teams: 20, twoRounds: true });
    await fillAllScoresViaJS(page);
    await page.locator('button:has-text("Таблиця")').click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Почати раунд 2")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('button:has-text("Повернутися до раунду 1")')).toBeVisible();
  });

  test('2-round system: start playoff after R2', async ({ page }) => {
    await setupTirTournament(page, { teams: 20, twoRounds: true });
    await fillAllScoresViaJS(page, 'scores');
    await page.locator('button:has-text("Таблиця")').click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Почати раунд 2")').click();
    await page.waitForTimeout(300);
    await fillAllScoresViaJS(page, 'scores2');
    await page.locator('button:has-text("Таблиця")').click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Почати плей-оф")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('button:has-text("Плей-оф")')).toBeVisible();
  });

  test('playoff match opens comparison view', async ({ page }) => {
    await setupTirTournament(page, { teams: 8 });
    await fillAllScoresViaJS(page);
    await page.locator('button:has-text("Таблиця")').click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Почати плей-оф")').click();
    await page.waitForTimeout(300);
    const match = page.locator('.tir-playoff__match').first();
    await match.click();
    await expect(page.locator('.tir-pmatch__overview')).toBeVisible();
    await expect(page.locator('.tir-pmatch__atelier')).toHaveCount(5);
  });

  test('junior mode uses 3 distances', async ({ page }) => {
    await setupTirTournament(page, { teams: 4, junior: true });
    await page.locator('.tir-scoring__participant-row').first().click();
    page.locator('.tir-pview__grid-row .tir-pview__grid-distance, .tir-pview__grid-row div:first-child');
    await expect(page.locator('.tir-pview__throws')).toContainText('/ 15');
  });
});
