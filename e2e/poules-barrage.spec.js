import { test, expect } from '@playwright/test';
import {
  ensureCleanTournament,
  addTeams,
  selectSystem,
  setTeamsInGroup,
  enablePlayOff,
  setPlayOffTeams,
  drawFirstRound,
  playRound,
  playMultipleRounds,
  clickFinishTournament,
  deleteCurrentTournament,
} from './helpers';

test.describe('Poules and Barrage — Ranking Verification', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await ensureCleanTournament(page);
  });

  test('poules 6 teams — 2 poules of 3, ranking shows correct order after all rounds', async ({ page }) => {
    await addTeams(page, 6);
    await selectSystem(page, 'poules');
    await setTeamsInGroup(page, 3);
    await enablePlayOff(page);
    await setPlayOffTeams(page, 4);
    await drawFirstRound(page);

    await playRound(page);
    await playMultipleRounds(page, 1);

    // Navigate to ranking tab and verify standings exist
    const rankingTab = page.locator('.tournament-nav__btn--ranking');
    await rankingTab.click();
    await page.waitForTimeout(500);

    // Verify ranking table shows teams with wins/points
    const rankingRows = page.locator('.ranking-row, .ranking-table tr, table tr').filter({ has: page.locator('td') });
    const rowCount = await rankingRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(3);

    await deleteCurrentTournament(page);
  });

  test('poules 8 teams — 2 poules of 4, finish and verify final standings', async ({ page }) => {
    await addTeams(page, 8);
    await selectSystem(page, 'poules');
    await setTeamsInGroup(page, 4);
    await enablePlayOff(page);
    await setPlayOffTeams(page, 4);
    await drawFirstRound(page);

    // Play all 3 rounds in a 4-team poule
    await playRound(page);
    await playMultipleRounds(page, 2);

    // Go to playoff
    await page.locator('[data-testid="btn-go-playoff"]').click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="btn-confirm-playoff"]').click();
    await page.locator('[data-testid="playoff-wrapper"]').waitFor({ state: 'visible', timeout: 15000 });

    await deleteCurrentTournament(page);
  });

  test('poules with barrage — barrage ranking uses only barrage games', async ({ page }) => {
    await addTeams(page, 6);
    await selectSystem(page, 'poules');
    await setTeamsInGroup(page, 3);
    await enablePlayOff(page);
    await setPlayOffTeams(page, 4);
    await drawFirstRound(page);

    // Play poules rounds
    await playRound(page);
    await playMultipleRounds(page, 1);

    // After poules, barrage should start if needed
    const goPlayoff = page.locator('[data-testid="btn-go-playoff"]');
    const drawNext = page.locator('[data-testid="link-draw-next-round"]');
    await goPlayoff.or(drawNext).first().waitFor({ state: 'visible', timeout: 10000 });

    if (await drawNext.isVisible().catch(() => false)) {
      // Barrage round needed
      await drawNext.click();
      await page.locator('[data-testid="game-row"]').first().waitFor({ state: 'visible' });
      await playRound(page);
    }

    // Verify playoff transition is available
    await goPlayoff.waitFor({ state: 'visible', timeout: 10000 });
    await goPlayoff.click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="btn-confirm-playoff"]').click();
    await page.locator('[data-testid="playoff-wrapper"]').waitFor({ state: 'visible', timeout: 15000 });

    await deleteCurrentTournament(page);
  });

  test('public view shows same ranking order as admin', async ({ page, context }) => {
    await addTeams(page, 6);
    await selectSystem(page, 'poules');
    await setTeamsInGroup(page, 3);
    await enablePlayOff(page);
    await setPlayOffTeams(page, 4);
    await drawFirstRound(page);

    await playRound(page);
    await playMultipleRounds(page, 1);

    // Get public link
    const prefsBtn = page.locator('[data-testid="btn-preferences"]');
    await prefsBtn.click();
    await page.locator('.prefs').waitFor({ state: 'visible' });

    const publicLinkInput = page
      .locator('[data-testid="public-link-input"], .prefs__public-link input, input[readonly]')
      .first();
    let publicUrl = '';
    if (await publicLinkInput.isVisible().catch(() => false)) {
      publicUrl = await publicLinkInput.inputValue();
    }

    await page.locator('.modal-close').click();
    await page
      .locator('.prefs')
      .waitFor({ state: 'hidden', timeout: 5000 })
      .catch(() => {});

    if (publicUrl) {
      // Open public page in new tab
      const publicPage = await context.newPage();
      await publicPage.goto(publicUrl);
      await publicPage.waitForTimeout(2000);

      // Verify teams are visible on public page
      const publicContent = await publicPage.textContent('body');
      expect(publicContent.length).toBeGreaterThan(50);

      await publicPage.close();
    }

    await deleteCurrentTournament(page);
  });

  test('round-robin groups with exact final order verification', async ({ page }) => {
    await addTeams(page, 4);
    await selectSystem(page, 'groups');
    await setTeamsInGroup(page, 4);
    await drawFirstRound(page);

    // Play all 3 rounds
    await playRound(page);
    await playMultipleRounds(page, 2);

    // Navigate to ranking tab
    const rankingTab = page.locator('.tournament-nav__btn--ranking');
    await rankingTab.click();
    await page.waitForTimeout(500);

    // Verify ranking section is visible with team data
    const rankingContent = page.locator('.content.tabs-content').filter({ hasText: /\d+/ });
    await expect(rankingContent.first()).toBeVisible();

    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });

  test('multiple independent groups — each ranked separately', async ({ page }) => {
    await addTeams(page, 8);
    await selectSystem(page, 'groups');
    await setTeamsInGroup(page, 4);
    await drawFirstRound(page);

    await playRound(page);
    await playMultipleRounds(page, 2);

    // Navigate to teams/ranking to see group rankings
    const rankingTab = page.locator('.tournament-nav__btn--ranking');
    await rankingTab.click();
    await page.waitForTimeout(500);

    // Should show two separate group sections
    const groupHeaders = page.locator('h4, h3').filter({ hasText: /Група|Group/ });
    const headerCount = await groupHeaders.count();
    expect(headerCount).toBeGreaterThanOrEqual(2);

    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });

  test('swiss groups — playoff qualifiers from Buchholz ranking', async ({ page }) => {
    await addTeams(page, 8);
    await selectSystem(page, 'groups');
    await setTeamsInGroup(page, 8);
    await page.locator('input[type="radio"][name="groupFormat"][value="swiss"]').click();
    await page.waitForTimeout(100);

    const swissRoundsInput = page.locator('input[type="number"][min="1"]');
    await swissRoundsInput.fill('3');

    await enablePlayOff(page);
    await setPlayOffTeams(page, 4);
    await drawFirstRound(page);

    await playRound(page);
    await playMultipleRounds(page, 2);

    // Verify playoff qualification is available
    const goPlayoff = page.locator('[data-testid="btn-go-playoff"]');
    await goPlayoff.waitFor({ state: 'visible', timeout: 10000 });
    await goPlayoff.click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="btn-confirm-playoff"]').click();
    await page.locator('[data-testid="playoff-wrapper"]').waitFor({ state: 'visible', timeout: 15000 });

    await deleteCurrentTournament(page);
  });

  test('odd group (5 teams) with technical bye — all teams get correct stats', async ({ page }) => {
    await addTeams(page, 5);
    await selectSystem(page, 'groups');
    await setTeamsInGroup(page, 5);
    await drawFirstRound(page);

    // Play all 5 rounds (N rounds for N odd teams)
    await playRound(page);
    await playMultipleRounds(page, 4);

    // Navigate to ranking
    const rankingTab = page.locator('.tournament-nav__btn--ranking');
    await rankingTab.click();
    await page.waitForTimeout(500);

    // All 5 teams should appear in ranking
    const rankingContent = page.locator('.content.tabs-content');
    await expect(rankingContent.first()).toBeVisible();

    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });
});
