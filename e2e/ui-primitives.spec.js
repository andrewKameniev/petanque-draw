import { expect, test } from '@playwright/test';
import { assertBrowserEmulatorSentinel, login } from './helpers';
import { cleanupOwnedTournament, createFixtureId, seedOwnedTournament } from './firebase-fixtures';

function activeTournamentRecord(name, timer = { timerStatus: 'not_started', remainingMs: 0 }) {
  return {
    name,
    date: '2026-08-06',
    activeGroup: 'A',
    main: {
      system: 'swiss',
      tournamentIsStarted: true,
      tournamentIsFinished: false,
      roundIsActive: true,
      teams: [{ title: 'Primitive A' }, { title: 'Primitive B' }],
      games: [
        [
          {
            team_1: 'Primitive A',
            team_2: 'Primitive B',
            team_1_score: 0,
            team_2_score: 0,
            status: 'in_progress',
            field: 1,
          },
        ],
      ],
      roundTimer: timer,
      preferences: {
        maxScore: 13,
        fieldsStart: 1,
        timeLimitEnabled: true,
        timeLimit: 30,
        cochonettes: 1,
      },
    },
  };
}

async function useEnglish(page) {
  await page.addInitScript(() => localStorage.setItem('petanqueDrawLang', 'en'));
}

test.describe('Task 11 shared UI parent integrations', () => {
  test.describe.configure({ timeout: 60_000 });

  test('@task11 admin navigation and timer use public controls and native semantics', async ({ page }) => {
    const tournamentId = createFixtureId(70);
    await useEnglish(page);
    await page.goto('/#/');
    await assertBrowserEmulatorSentinel(page);
    await seedOwnedTournament(tournamentId, activeTournamentRecord('Task 11 Admin Primitives'));
    await login(page);

    try {
      await page.goto(`/#/?t=${tournamentId}`);
      await expect(page.locator('[data-testid="tournament-name-row"]')).toContainText('Task 11 Admin Primitives', {
        timeout: 10_000,
      });

      const tablist = page.getByRole('tablist', { name: 'Tournament sections' });
      await expect(tablist).toBeVisible();
      await expect(tablist.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);
      await expect(tablist.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);

      const teamsTab = tablist.locator('#tournament-admin-tab-teams');
      const streamsTab = tablist.locator('#tournament-admin-tab-streams');
      await teamsTab.focus();
      await teamsTab.press('End');
      await expect(streamsTab).toBeFocused();
      await expect(streamsTab).toHaveAttribute('aria-selected', 'true');
      await expect(streamsTab).toHaveAttribute('aria-controls', 'tournament-admin-tabpanel');

      await streamsTab.press('ArrowRight');
      await expect(teamsTab).toBeFocused();
      await expect(teamsTab).toHaveAttribute('aria-selected', 'true');

      const gamesTab = tablist.locator('#tournament-admin-tab-games');
      await gamesTab.click();
      await expect(page.locator('#tournament-admin-tabpanel')).toHaveAttribute(
        'aria-labelledby',
        'tournament-admin-tab-games',
      );

      const startTimer = page.getByRole('button', { name: 'Start timer' });
      await expect(startTimer).toHaveAttribute('type', 'button');
      await startTimer.click();

      const timer = page.locator('.round-timer');
      await expect(timer).toBeVisible();
      await expect(timer).not.toHaveAttribute('role', 'button');
      await expect(timer.locator('button button, button input')).toHaveCount(0);

      const pause = page.getByRole('button', { name: 'Pause' });
      await expect(pause).toHaveAttribute('type', 'button');
      await pause.click();
      const resume = page.getByRole('button', { name: 'Resume' });
      await expect(resume).toBeVisible();
      await resume.click();
      await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

      const restartToggle = page.locator('.round-timer__restart-toggle');
      await expect(restartToggle).toHaveAttribute('aria-expanded', 'false');
      await restartToggle.click();
      await expect(restartToggle).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByRole('spinbutton', { name: 'Custom minutes' })).toBeVisible();
      await expect(page.locator('.round-timer__restart button:not([type="button"])')).toHaveCount(0);
    } finally {
      await cleanupOwnedTournament(tournamentId);
    }
  });

  test('@task11 public shell keeps navigation and the read-only timer responsive', async ({ page }) => {
    const tournamentId = createFixtureId(80);
    await useEnglish(page);
    await page.goto('/#/');
    await assertBrowserEmulatorSentinel(page);
    const fixture = await seedOwnedTournament(
      tournamentId,
      activeTournamentRecord('Task 11 Public Primitives', {
        timerStatus: 'paused',
        timerStartedAt: '2026-08-06T08:00:00.000Z',
        timerEndsAt: null,
        remainingMs: 65_000,
      }),
    );

    try {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/#/tournament?ref=${fixture.ref}`);

      const shell = page.locator('.public-page-shell');
      const tablist = page.getByRole('tablist', { name: 'Tournament sections' });
      await expect(shell).toBeVisible({ timeout: 10_000 });
      await expect(tablist).toBeVisible();
      await expect(tablist.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);

      const timer = page.locator('.round-timer');
      await expect(timer).toContainText('1:05');
      await expect(timer).not.toHaveAttribute('role', 'button');
      await expect(timer.getByRole('button')).toHaveCount(0);

      await page.getByRole('button', { name: 'Dark theme' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

      await page.setViewportSize({ width: 375, height: 812 });
      await expect(tablist).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);
    } finally {
      await cleanupOwnedTournament(tournamentId);
    }
  });
});
