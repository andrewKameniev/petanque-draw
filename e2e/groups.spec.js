import { test, expect } from '@playwright/test';
import {
  ensureCleanTournament,
  addTeams,
  selectSystem,
  setTeamsInGroup,
  drawFirstRound,
  playRound,
  playMultipleRounds,
  playNextCircle,
  clickFinishTournament,
  deleteCurrentTournament,
} from './helpers';

test.describe('Groups (Round-Robin) System', () => {
  test.beforeEach(async ({ page }) => {
    await ensureCleanTournament(page);
  });

  test('8 teams — 2 groups of 4, full round-robin (3 rounds)', async ({ page }) => {
    await addTeams(page, 8);
    await selectSystem(page, 'groups');
    await setTeamsInGroup(page, 4);
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 2);
    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });

  test('9 teams (odd) — 3 groups of 3, full round-robin with bye', async ({ page }) => {
    await addTeams(page, 9);
    await selectSystem(page, 'groups');
    await setTeamsInGroup(page, 3);
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 2);
    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });

  test('16 teams — 4 groups of 4, full round-robin (3 rounds)', async ({ page }) => {
    await addTeams(page, 16);
    await selectSystem(page, 'groups');
    await setTeamsInGroup(page, 4);
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 2);
    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });

  test('12 teams — 2 groups of 6, full round-robin (5 rounds)', async ({ page }) => {
    await addTeams(page, 12);
    await selectSystem(page, 'groups');
    await setTeamsInGroup(page, 6);
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 4);
    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });

  test('7 teams (odd) — 1 group of 7, full round-robin with bye (7 rounds)', async ({ page }) => {
    await addTeams(page, 7);
    await selectSystem(page, 'groups');
    await setTeamsInGroup(page, 7);
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 6);
    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });

  test('5 teams (odd) — 1 group of 5, full round-robin with bye (5 rounds)', async ({ page }) => {
    await addTeams(page, 5);
    await selectSystem(page, 'groups');
    await setTeamsInGroup(page, 5);
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 4);
    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });

  test('4 teams — multi-circle round-robin (2 circles)', async ({ page }) => {
    await addTeams(page, 4);
    await selectSystem(page, 'groups');
    await setTeamsInGroup(page, 4);
    await drawFirstRound(page);

    // Circle 1: 3 rounds (everyone plays everyone)
    await playRound(page);
    await playMultipleRounds(page, 2);

    // After circle 1, "Play next circle" button appears
    await expect(page.locator('[data-testid="link-play-next-circle"]')).toBeVisible();

    // Start circle 2
    await playNextCircle(page);
    await playRound(page);
    await playMultipleRounds(page, 2);

    // After circle 2, "Play next circle" button appears again
    await expect(page.locator('[data-testid="link-play-next-circle"]')).toBeVisible();

    // Circles played info should show
    await expect(page.locator('.draw-card__circle-info')).toContainText('2');

    // Finish the tournament
    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });

  test('4 teams — multi-circle round-robin (3 circles), cumulative ranking', async ({ page }) => {
    await addTeams(page, 4);
    await selectSystem(page, 'groups');
    await setTeamsInGroup(page, 4);
    await drawFirstRound(page);

    // Play 3 full circles
    for (let circle = 0; circle < 3; circle++) {
      if (circle > 0) {
        await playNextCircle(page);
      }
      await playRound(page);
      await playMultipleRounds(page, 2);
    }

    // Finish and verify ranking exists
    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });
});
