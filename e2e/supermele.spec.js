import { test, expect } from '@playwright/test';
import {
  ensureCleanTournament,
  addTeams,
  selectSystem,
  drawFirstRound,
  playRound,
  drawNextRound,
  playMultipleRounds,
  clickFinishTournament,
  deleteCurrentTournament,
} from './helpers';

test.describe('Supermele System', () => {
  test.beforeEach(async ({ page }) => {
    await ensureCleanTournament(page);
  });

  test('8 players — doubles, 3 rounds, finish', async ({ page }) => {
    await addTeams(page, 8);
    await selectSystem(page, 'supermele');
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 2);
    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });

  test('9 players (odd) — triples, 3 rounds with bye', async ({ page }) => {
    await addTeams(page, 9);
    await selectSystem(page, 'supermele');
    await page
      .locator('select')
      .filter({ has: page.locator('option[value="3"]') })
      .last()
      .selectOption('3');
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 2);
    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });

  test('7 players (odd) — doubles, 3 rounds with bye', async ({ page }) => {
    await addTeams(page, 7);
    await selectSystem(page, 'supermele');
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 2);
    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });

  test('16 players — doubles, 4 rounds, finish', async ({ page }) => {
    await addTeams(page, 16);
    await selectSystem(page, 'supermele');
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 3);
    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });

  test('11 players (odd) — doubles, 3 rounds with bye', async ({ page }) => {
    await addTeams(page, 11);
    await selectSystem(page, 'supermele');
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 2);
    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });

  test('add players mid-tournament', async ({ page }) => {
    await addTeams(page, 6);
    await selectSystem(page, 'supermele');
    await drawFirstRound(page);
    await playRound(page);

    await page.locator('a', { hasText: /Teams|Команди/ }).click();
    await page.locator('input[placeholder*="Team title"], input[placeholder*="Назва"]').fill('LatePlayer');
    await page.locator('button', { hasText: /Add team|Додати/ }).click();

    await page.locator('a', { hasText: /Current games|Поточні ігри/ }).click();
    await drawNextRound(page);
    await expect(page.locator('[data-testid="game-row"]').first()).toBeVisible();
    await deleteCurrentTournament(page);
  });
});
