import { test, expect } from '@playwright/test';
import {
  ensureCleanTournament,
  addTeams,
  selectSystem,
  setTeamsInGroup,
  enablePlayOff,
  enableCadrage,
  setPlayOffTeams,
  drawFirstRound,
  playRound,
  playMultipleRounds,
  goToCadrage,
  deleteCurrentTournament,
} from './helpers';

async function openPublicTournament(adminPage, context) {
  await adminPage.locator('.remote-toolbar__btn').first().click();
  const link = await adminPage.locator('.qr-modal__link').first().getAttribute('href');
  expect(link).toBeTruthy();
  await adminPage.locator('.modal-close').click();

  const publicPage = await context.newPage();
  await publicPage.goto(link);
  await publicPage.locator('[data-testid="public-game-card"]').first().waitFor({ state: 'visible', timeout: 15000 });
  return publicPage;
}

async function finishFirstMatch(page, teamOneScore, teamTwoScore) {
  await page.locator('#team_0').fill(String(teamOneScore));
  await page.locator('#opponent_0').fill(String(teamTwoScore));
  await page.locator('[data-testid="game-row"]').first().locator('.game-row__finish-btn').click();
  await page.locator('[data-testid="btn-confirm-remove"]').click();
}

test.describe('Public match cards', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await ensureCleanTournament(page);
  });

  test('regular round keeps lane, stream, history, highlighting, and live score through completion', async ({
    page,
    context,
  }) => {
    let publicPage;
    try {
      await addTeams(page, 8);
      await page.locator('.setup-card__collapse-toggle').click();
      await page.locator('[data-testid="checkbox-cochonettes"]').check();
      await drawFirstRound(page);

      await page.locator('#tab-streams').click();
      await page.locator('.stream-preset__add').first().click();
      const streamInput = page.locator('.stream-preset__input').first();
      await streamInput.fill('https://youtube.com/watch?v=public-card-e2e');
      await streamInput.dispatchEvent('change');
      await page.locator('#tab-games').click();

      publicPage = await openPublicTournament(page, context);
      const firstCard = publicPage.locator('[data-testid="public-game-card"]').first();
      await expect(firstCard).toHaveClass(/match-item--upcoming/);
      await expect(firstCard.locator('.match-lane-left')).toHaveText('1');
      await expect(publicPage.locator('.match-live-link')).toHaveAttribute(
        'href',
        'https://youtube.com/watch?v=public-card-e2e',
      );

      const teamName = (await firstCard.locator('.match-team-right').textContent()).trim();
      await publicPage.locator('.team-search-btn').click();
      await publicPage.locator('.team-search-input').fill(teamName.toLocaleLowerCase());
      await publicPage.locator('.team-search-input').press('Enter');
      await expect(firstCard).toHaveClass(/match-item--highlighted/);

      await page.locator('#team_0').fill('3');
      await page.locator('#opponent_0').fill('1');
      await expect(firstCard).toHaveClass(/match-item--in-progress/, { timeout: 15000 });
      await expect(firstCard.locator('.match-score')).toContainText('3 : 1');
      await expect(firstCard.locator('.score-history__chip')).not.toHaveCount(0);

      await page.locator('[data-testid="game-row"]').first().locator('.game-row__finish-btn').click();
      await page.locator('[data-testid="btn-confirm-remove"]').click();
      await expect(firstCard).toHaveClass(/match-item--finished/, { timeout: 15000 });
      await expect(firstCard.locator('.match-team--winner')).toHaveText(teamName);
      await expect(firstCard.locator('.match-lane-left')).toHaveText('1');
    } finally {
      await publicPage?.close().catch(() => {});
      await page.bringToFront();
      await deleteCurrentTournament(page);
    }
  });

  test('group round preserves group headings and renders every match through the shared card', async ({
    page,
    context,
  }) => {
    let publicPage;
    try {
      await addTeams(page, 8);
      await selectSystem(page, 'groups');
      await setTeamsInGroup(page, 4);
      await drawFirstRound(page);

      publicPage = await openPublicTournament(page, context);
      await expect(publicPage.locator('.match-group')).toHaveCount(2);
      await expect(publicPage.locator('.match-group__title')).toHaveCount(2);
      await expect(publicPage.locator('[data-testid="public-game-card"]')).toHaveCount(4);
      const lanes = (await publicPage.locator('.match-lane-left').allTextContents()).sort();
      expect(lanes).toEqual(['1', '2', '3', '4']);
    } finally {
      await publicPage?.close().catch(() => {});
      await page.bringToFront();
      await deleteCurrentTournament(page);
    }
  });

  test('cadrage renders the resolved lane and persisted winner through the shared card', async ({ page, context }) => {
    let publicPage;
    try {
      await addTeams(page, 8);
      await enablePlayOff(page);
      await setPlayOffTeams(page, 4);
      await enableCadrage(page);
      await drawFirstRound(page);
      await playRound(page);
      await playMultipleRounds(page, 2);
      await goToCadrage(page);

      publicPage = await openPublicTournament(page, context);
      const firstCard = publicPage.locator('[data-testid="public-game-card"]').first();
      const winningTeam = (await firstCard.locator('.match-team-right').textContent()).trim();
      await expect(firstCard.locator('.match-lane-left')).toHaveText('1');

      await finishFirstMatch(page, 13, 4);
      await expect(firstCard).toHaveClass(/match-item--finished/, { timeout: 15000 });
      await expect(firstCard.locator('.match-team--winner')).toHaveText(winningTeam);
      await expect(firstCard.locator('.match-lane-left')).toHaveText('1');
    } finally {
      await publicPage?.close().catch(() => {});
      await page.bringToFront();
      await deleteCurrentTournament(page);
    }
  });
});
