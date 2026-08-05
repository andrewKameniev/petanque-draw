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

async function syncTirParticipants(page) {
  await page.evaluate(() => {
    const app = document.querySelector('#app').__vue_app__;
    const store = app.config.globalProperties.$pinia._s.get('main');
    store.syncTirParticipants();
  });
  await page.waitForTimeout(500);
}

async function getPublicTournamentRef(page) {
  return page.evaluate(() => {
    const app = document.querySelector('#app').__vue_app__;
    const store = app.config.globalProperties.$pinia._s.get('main');
    return `${store.user.uid}.${Number(store.currentTournamentIndex).toString(36)}`;
  });
}

async function fillBoundaryTieViaJS(page) {
  await page.evaluate(() => {
    const app = document.querySelector('#app').__vue_app__;
    const store = app.config.globalProperties.$pinia._s.get('main');
    const tournament = store.currentTournament.main || store.currentTournament;
    const distances = [6, 7, 8, 9];
    tournament.tirParticipants.forEach((participant, participantIndex) => {
      participant.scores = {};
      const resultType = participantIndex < 3 ? 'carreau' : participantIndex < 5 ? 'reussi' : 'manque';
      for (let atelierIndex = 0; atelierIndex < 5; atelierIndex++) {
        participant.scores[atelierIndex] = {};
        distances.forEach((distance) => {
          participant.scores[atelierIndex][distance] = resultType;
        });
      }
    });
  });
}

async function completeActiveTiebreakerViaJS(page) {
  await page.evaluate(() => {
    const app = document.querySelector('#app').__vue_app__;
    const store = app.config.globalProperties.$pinia._s.get('main');
    const tournament = store.currentTournament.main || store.currentTournament;
    const ids = tournament.tirTiebreakerParticipantIds;
    ids.forEach((id, participantIndex) => {
      const participant = tournament.tirParticipants.find((item) => item.id === id);
      participant.tiebreaker_1 = {};
      for (let atelierIndex = 0; atelierIndex < 5; atelierIndex++) {
        participant.tiebreaker_1[atelierIndex] = { 7: participantIndex === 0 ? 'carreau' : 'manque' };
      }
    });
    store.syncTirParticipants();
  });
  await page.waitForTimeout(500);
}

async function completePlayoffMatchesViaJS(page, target) {
  await page.evaluate((target) => {
    const app = document.querySelector('#app').__vue_app__;
    const store = app.config.globalProperties.$pinia._s.get('main');
    const tournament = store.currentTournament.main || store.currentTournament;
    const playoff = tournament.tirPlayoff;
    const matches =
      target === 'opening'
        ? playoff.rounds[playoff.rounds.length - 1].matches
        : [playoff.thirdPlace, playoff.final].filter(Boolean);
    const distances = tournament.tirConfig?.junior ? [6, 7, 8] : [6, 7, 8, 9];

    matches.forEach((match) => {
      match.scores1 = {};
      match.scores2 = {};
      for (let atelierIndex = 0; atelierIndex < 5; atelierIndex++) {
        match.scores1[atelierIndex] = {};
        match.scores2[atelierIndex] = {};
        distances.forEach((distance) => {
          match.scores1[atelierIndex][distance] = 'carreau';
          match.scores2[atelierIndex][distance] = 'reussi';
        });
      }
      match.score1 = distances.length * 5 * 5;
      match.score2 = distances.length * 5 * 3;
      match.complete = true;
      match.winner = match.player1;
      match.loser = match.player2;
      match.tieWinner = null;
    });
    store.syncTirPlayoff();
  }, target);
  await page.waitForTimeout(500);
}

test.describe('TIR Tournament', () => {
  test.describe.configure({ timeout: 60000 });

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

  test('boundary tie completes EX scoring and selects the correct R2 field', async ({ page }) => {
    await setupTirTournament(page, { teams: 20, twoRounds: true });
    await fillBoundaryTieViaJS(page);
    const tiedIds = await page.evaluate(() => {
      const store = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('main');
      const tournament = store.currentTournament.main || store.currentTournament;
      return [tournament.tirParticipants[3].id, tournament.tirParticipants[4].id];
    });

    await page.locator('button:has-text("Таблиця")').click();
    await page.getByRole('button', { name: 'Почати перестрілку' }).click();
    await completeActiveTiebreakerViaJS(page);
    await page.getByRole('button', { name: 'Завершити перестрілку' }).click();
    await page.getByRole('button', { name: 'Почати раунд 2' }).click();

    const state = await page.evaluate(() => {
      const store = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('main');
      const tournament = store.currentTournament.main || store.currentTournament;
      return { round: tournament.tirRound, ids: tournament.tirR2Participants };
    });
    expect(state.round).toBe(2);
    expect(state.ids).toHaveLength(16);
    expect(state.ids).not.toContain(tiedIds[0]);
    expect(state.ids).toContain(tiedIds[1]);
  });

  test('edits and completes semifinal, third-place, and final matches', async ({ page }) => {
    await setupTirTournament(page, { teams: 4 });
    await fillAllScoresViaJS(page);
    await page.locator('button:has-text("Таблиця")').click();
    await page.getByRole('button', { name: 'Почати плей-оф' }).click();

    await page.locator('.tir-playoff__match').first().click();
    await page.locator('.tir-pmatch__circles--left .tir-pmatch__circle--carreau').first().click();
    await expect(page.locator('.tir-pmatch__player-score').first()).toContainText('5/');
    await page.getByRole('button', { name: /до сітки/i }).click();
    await page.waitForTimeout(400);

    await completePlayoffMatchesViaJS(page, 'opening');
    await page.locator('.tir-playoff__match').first().click();
    await page.getByRole('button', { name: /до сітки/i }).click();
    await expect(page.locator('.tir-playoff__round-title')).toContainText(['Півфінал', 'Матч за 3 місце', 'Фінал']);

    await completePlayoffMatchesViaJS(page, 'medals');
    await expect(page.locator('.tir-playoff__advance-btn')).toBeVisible();
    await page.locator('.tir-playoff__advance-btn').click();
    await expect(page.locator('.tir-nav__btn--protocol')).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const store = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('main');
          const tournament = store.currentTournament.main || store.currentTournament;
          return tournament.tournamentIsFinished;
        }),
      )
      .toBe(true);
  });

  test('public view tracks live progress, R1/R2 table, and playoff results', async ({ page, context }) => {
    await setupTirTournament(page, { teams: 20, twoRounds: true });
    const participantName = await page.locator('.tir-scoring__participant-name').first().textContent();
    const publicRef = await getPublicTournamentRef(page);
    const publicPage = await context.newPage();
    await publicPage.goto(`/#/tournament?ref=${publicRef}`);
    await expect(publicPage.locator('.tir-plist__row')).toHaveCount(20, { timeout: 10000 });

    await page.locator('.tir-scoring__participant-row').first().click();
    await page.locator('.tir-pview__grid-row').first().locator('.tir-pview__grid-cell').first().click();
    const publicParticipant = publicPage.locator('.tir-plist__row', { hasText: participantName.trim() });
    await expect(publicParticipant.locator('.tir-plist__progress-text')).toContainText('1/20', { timeout: 10000 });
    await expect(publicParticipant.locator('.tir-plist__score')).toContainText('5/100');

    await page.locator('.tir-pview__back').click();
    await fillAllScoresViaJS(page, 'scores');
    await page.locator('button:has-text("Таблиця")').click();
    await page.getByRole('button', { name: 'Почати раунд 2' }).click();
    await fillAllScoresViaJS(page, 'scores2');
    await syncTirParticipants(page);

    await publicPage.getByRole('button', { name: 'Таблиця' }).click();
    await expect(publicPage.locator('.tir-table__content thead')).toContainText('Р1');
    await expect(publicPage.locator('.tir-table__content thead')).toContainText('Р2');
    await expect(publicPage.locator('.tir-table__content tbody tr')).toHaveCount(20);

    await page.locator('button:has-text("Таблиця")').click();
    await page.getByRole('button', { name: 'Почати плей-оф' }).click();
    await expect(publicPage.locator('.tir-playoff__match').first()).toBeVisible({ timeout: 10000 });
    await completePlayoffMatchesViaJS(page, 'opening');
    await expect(publicPage.locator('.tir-playoff__match').first()).toContainText('100', { timeout: 10000 });
    await expect(publicPage.locator('.tir-playoff__match').first()).toContainText('60');
    await publicPage.close();
  });

  test('reload resubscribes without losing an in-progress score', async ({ page }) => {
    await setupTirTournament(page, { teams: 4 });
    const participantName = await page.locator('.tir-scoring__participant-name').first().textContent();
    await page.locator('.tir-scoring__participant-row').first().click();
    await page.locator('.tir-pview__grid-row').first().locator('.tir-pview__grid-cell').first().click();
    await page.waitForTimeout(800);

    await page.reload();
    await expect(page.locator('.tir-scoring__participant-row')).toHaveCount(4, { timeout: 15000 });
    const participant = page.locator('.tir-scoring__participant-row', { hasText: participantName.trim() });
    await expect(participant).toContainText('1 / 20');
    await expect(participant.locator('.tir-scoring__participant-score')).toContainText('5/100');
  });
});
