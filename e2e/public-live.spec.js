import { expect, test } from '@playwright/test';
import {
  cleanupOwnedTournament,
  createFixtureId,
  seedOwnedTournament,
  updateOwnedTournamentPath,
} from './firebase-fixtures';

function liveRecord(name = 'Public Live Cup') {
  return {
    name,
    tournamentMessage: 'Initial organizer message',
    activeGroup: 'A',
    main: {
      system: 'swiss',
      tournamentIsStarted: true,
      tournamentIsFinished: false,
      roundIsActive: true,
      roundTimer: { timerStatus: 'not_started', remainingMs: 0 },
      teams: [{ title: 'Live One' }, { title: 'Live Two' }],
      games: [
        [
          {
            team_1: 'Live One',
            team_2: 'Live Two',
            team_1_score: 1,
            team_2_score: 0,
            status: 'in_progress',
            field: 1,
          },
        ],
      ],
      preferences: { maxScore: 13, fieldsStart: 1, timeLimitEnabled: true, cochonettes: 1 },
    },
  };
}

function tirRecord() {
  return {
    name: 'Public Live Tir',
    activeGroup: 'A',
    main: {
      system: 'tir',
      tournamentIsStarted: true,
      tournamentIsFinished: false,
      tirStarted: true,
      tirRound: 1,
      tirConfig: { rounds: 1, junior: false },
      tirParticipants: [{ id: 'alice', name: 'Alice', scores: {} }],
      teams: [{ title: 'Alice' }],
      games: [],
      preferences: { maxScore: 13, fieldsStart: 1 },
    },
  };
}

async function useEnglish(page) {
  await page.addInitScript(() => localStorage.setItem('petanqueDrawLang', 'en'));
}

function legacyRef(ownerUid, tournamentId) {
  return globalThis.btoa(`${ownerUid}:${tournamentId}`);
}

test.describe('Public and TV shared live tournament source', () => {
  test.setTimeout(60_000);

  test('dotted Public and legacy TV links receive score, timer, message, and reconnect updates', async ({
    context,
  }) => {
    const tournamentId = createFixtureId(50);
    const fixture = await seedOwnedTournament(tournamentId, liveRecord());
    const publicPage = await context.newPage();
    const tvPage = await context.newPage();
    await Promise.all([useEnglish(publicPage), useEnglish(tvPage)]);

    try {
      await Promise.all([
        publicPage.goto(`/#/tournament?ref=${fixture.ref}`),
        tvPage.goto(`/#/tv?ref=${legacyRef(fixture.uid, tournamentId)}`),
      ]);

      const publicCard = publicPage.locator('[data-testid="public-game-card"]').first();
      await expect(publicCard).toBeVisible({ timeout: 15_000 });
      await expect(tvPage.locator('.tv__card').first()).toBeVisible({ timeout: 15_000 });
      await expect(publicPage.locator('.tournament-title-wrapper')).toContainText('Public Live Cup');
      await expect(tvPage.locator('.tv__tournament-name')).toContainText('Public Live Cup');

      await Promise.all([
        updateOwnedTournamentPath(tournamentId, 'main/games/0/0/team_1_score', 7),
        updateOwnedTournamentPath(tournamentId, 'main/games/0/0/team_2_score', 4),
      ]);
      await expect(publicCard.locator('.match-score')).toContainText('7 : 4', { timeout: 10_000 });
      await expect(tvPage.locator('.tv__card-score').first()).toContainText('7 : 4', { timeout: 10_000 });

      const now = Date.now();
      await updateOwnedTournamentPath(tournamentId, 'main/roundTimer', {
        timerStatus: 'running',
        timerStartedAt: new Date(now).toISOString(),
        timerEndsAt: new Date(now + 90_000).toISOString(),
        remainingMs: 90_000,
      });
      await expect(publicPage.locator('.round-timer')).toBeVisible({ timeout: 10_000 });
      await expect(tvPage.locator('.tv__timer-value')).not.toHaveText('--:--', { timeout: 10_000 });

      await updateOwnedTournamentPath(tournamentId, 'main/roundTimer', {
        timerStatus: 'paused',
        timerStartedAt: new Date(now).toISOString(),
        timerEndsAt: null,
        remainingMs: 65_000,
      });
      await expect(publicPage.locator('.round-timer')).toContainText('1:05', { timeout: 10_000 });
      await expect(tvPage.locator('.tv__timer-value')).toHaveText('1:05', { timeout: 10_000 });

      await updateOwnedTournamentPath(tournamentId, 'tournamentMessage', 'Live organizer message');
      await expect(publicPage.locator('.tournament-info-message')).toContainText('Live organizer message', {
        timeout: 10_000,
      });
      await expect(tvPage.locator('.tv__system-message')).toContainText('Live organizer message', { timeout: 10_000 });

      await updateOwnedTournamentPath(tournamentId, 'main/roundTimer', {
        timerStatus: 'ended',
        remainingMs: 0,
      });
      await expect(publicPage.locator('.round-timer')).toHaveClass(/round-timer--ended/, { timeout: 10_000 });
      await expect(tvPage.locator('.tv__timer-value')).toHaveText('0:00', { timeout: 10_000 });

      await Promise.all([
        publicPage.evaluate(() => window.dispatchEvent(new Event('online'))),
        tvPage.evaluate(() => window.dispatchEvent(new Event('online'))),
      ]);
      await updateOwnedTournamentPath(tournamentId, 'main/games/0/0/team_1_score', 9);
      await expect(publicCard.locator('.match-score')).toContainText('9 : 4', { timeout: 10_000 });
      await expect(tvPage.locator('.tv__card-score').first()).toContainText('9 : 4', { timeout: 10_000 });

      await publicPage.reload();
      await expect(publicPage.locator('[data-testid="public-game-card"]').first()).toBeVisible({ timeout: 15_000 });
      await updateOwnedTournamentPath(tournamentId, 'main/games/0/0/team_2_score', 6);
      await expect(publicPage.locator('.match-score').first()).toContainText('9 : 6', { timeout: 10_000 });
      await expect(tvPage.locator('.tv__card-score').first()).toContainText('9 : 6', { timeout: 10_000 });
    } finally {
      await Promise.all([publicPage.close(), tvPage.close()]);
      await cleanupOwnedTournament(tournamentId);
    }
  });

  test('Group B creation and child updates appear live in Public', async ({ page }) => {
    const tournamentId = createFixtureId(60);
    const fixture = await seedOwnedTournament(tournamentId, liveRecord('Public Live Group B'));
    await useEnglish(page);

    try {
      await page.goto(`/#/tournament?ref=${fixture.ref}`);
      await expect(page.locator('[data-testid="public-game-card"]').first()).toContainText('Live One', {
        timeout: 15_000,
      });

      await updateOwnedTournamentPath(tournamentId, 'tournamentB', {
        system: 'swiss',
        tournamentIsStarted: true,
        roundIsActive: true,
        teams: [{ title: 'Live B One' }, { title: 'Live B Two' }],
        games: [
          [
            {
              team_1: 'Live B One',
              team_2: 'Live B Two',
              team_1_score: 2,
              team_2_score: 1,
              status: 'in_progress',
              field: 2,
            },
          ],
        ],
        preferences: { maxScore: 13, fieldsStart: 1 },
      });

      const switcher = page.locator('.group-switcher');
      await expect(switcher).toBeVisible({ timeout: 10_000 });
      await switcher.locator('.group-switcher__btn').nth(1).click();
      const groupBCard = page.locator('[data-testid="public-game-card"]').first();
      await expect(groupBCard).toContainText('Live B One');

      await updateOwnedTournamentPath(tournamentId, 'tournamentB/games/0/0/team_1_score', 11);
      await expect(groupBCard.locator('.match-score')).toContainText('11 : 1', { timeout: 10_000 });
    } finally {
      await cleanupOwnedTournament(tournamentId);
    }
  });

  test('Tir participants, round, playoff score, and finish update live in Public', async ({ page }) => {
    const tournamentId = createFixtureId(70);
    const fixture = await seedOwnedTournament(tournamentId, tirRecord());
    await useEnglish(page);

    try {
      await page.goto(`/#/tournament?ref=${fixture.ref}`);
      await expect(page.locator('.tir-plist__row')).toContainText('Alice', { timeout: 15_000 });

      await Promise.all([
        updateOwnedTournamentPath(tournamentId, 'main/tirParticipants', [
          { id: 'alice', name: 'Alice', scores: { 0: { 6: 'carreau' } } },
          { id: 'bob', name: 'Bob', scores: {} },
        ]),
        updateOwnedTournamentPath(tournamentId, 'main/teams', [{ title: 'Alice' }, { title: 'Bob' }]),
        updateOwnedTournamentPath(tournamentId, 'main/tirRound', 2),
      ]);
      await expect(page.locator('.tir-plist__row')).toHaveCount(2, { timeout: 10_000 });
      await expect(page.locator('.tir-plist__row').nth(1)).toContainText('Bob');

      await updateOwnedTournamentPath(tournamentId, 'main/tirPlayoff', {
        size: 2,
        rounds: [],
        final: {
          player1: 'Alice',
          player2: 'Bob',
          score1: 10,
          score2: 7,
          complete: true,
          winner: 'Alice',
          loser: 'Bob',
        },
      });
      const playoffButton = page.locator('.tournament-nav__btn').filter({ hasText: 'Playoff' });
      await expect(playoffButton).toBeVisible({ timeout: 10_000 });
      await playoffButton.click();
      await expect(page.locator('.tir-playoff__match')).toContainText('10', { timeout: 10_000 });
      await expect(page.locator('.tir-playoff__match')).toContainText('7');

      await updateOwnedTournamentPath(tournamentId, 'main/tournamentIsFinished', true);
      await expect(page.locator('.winner-card')).toContainText('Alice', { timeout: 10_000 });
    } finally {
      await cleanupOwnedTournament(tournamentId);
    }
  });
});
