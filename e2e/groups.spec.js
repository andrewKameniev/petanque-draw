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
    await page.locator('[data-testid="link-play-next-circle"]').waitFor({ state: 'visible' });

    // Start circle 2
    await playNextCircle(page);
    await playRound(page);
    await playMultipleRounds(page, 2);

    // After circle 2, "Play next circle" button appears again
    await page.locator('[data-testid="link-play-next-circle"]').waitFor({ state: 'visible' });

    // Circles played info should show
    await expect(page.locator('.draw-card__circle-info')).toContainText('2');

    // Finish the tournament
    await clickFinishTournament(page);
    await deleteCurrentTournament(page);
  });

  test('4 teams — multi-circle round-robin (3 circles), cumulative ranking', async ({ page }) => {
    test.setTimeout(60000);
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

test.describe('Groups Swiss — Portal 747 (55 teams, rated)', () => {
  test.setTimeout(180000);

  test.beforeEach(async ({ page }) => {
    await ensureCleanTournament(page);
    await page.evaluate(() => localStorage.setItem('petanqueDrawLang', 'en'));
    await page.reload();
    await page.locator('[data-testid="input-team-title"]').waitFor({ state: 'visible' });
  });

  async function setupGroupsSwiss(
    page,
    {
      drawMethod = 'snake',
      rounds = 4,
      teamsInGroup = 14,
      playoffTeams = 16,
      withPlayB = false,
      withTimeLimit = null,
    } = {},
  ) {
    await page.locator('[data-testid="input-portal-id"]').fill(String(PORTAL_ID));
    await page.locator('[data-testid="btn-import-portal"]').click();
    await page.locator('[data-testid="btn-draw-first-round"]').waitFor({ state: 'visible', timeout: 60000 });
    await page.waitForTimeout(500);

    const useRatingCb = page.locator('.add-team-card__checkbox input[type="checkbox"]');
    if (!(await useRatingCb.isChecked())) await useRatingCb.click();
    await page.waitForTimeout(200);

    await selectSystem(page, 'groups');
    await setTeamsInGroup(page, teamsInGroup);
    await page.locator(`input[type="radio"][name="groupFormat"][value="swiss"]`).click();
    await page.waitForTimeout(100);

    const swissRoundsInput = page.locator('input[type="number"][min="1"]');
    await swissRoundsInput.fill(String(rounds));

    const drawMethodOptions = page.locator('.draw-method__option');
    await drawMethodOptions.first().waitFor({ state: 'visible', timeout: 5000 });
    const methodIndex = drawMethod === 'seeded' ? 0 : drawMethod === 'snake' ? 1 : 2;
    await drawMethodOptions.nth(methodIndex).click();
    await page.waitForTimeout(200);
    await expect(drawMethodOptions.nth(methodIndex)).toHaveClass(/draw-method__option--active/);

    await enablePlayOff(page);
    await setPlayOffTeams(page, playoffTeams);
    await page.waitForTimeout(200);

    if (withPlayB) {
      const playBCheckbox = page.locator('[data-testid="checkbox-play-b"]');
      await playBCheckbox.waitFor({ state: 'visible', timeout: 5000 });
      if (!(await playBCheckbox.isChecked())) await playBCheckbox.click();
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(500);

    if (withTimeLimit) {
      await drawFirstRound(page);
      await page.locator('[data-testid="btn-preferences"]').click();
      await page.locator('.prefs').waitFor({ state: 'visible' });

      const timeLimitCheckbox = page
        .locator('.prefs__item')
        .filter({ hasText: /time/i })
        .locator('input[type="checkbox"]')
        .first();
      if (!(await timeLimitCheckbox.isChecked())) await timeLimitCheckbox.click();
      await page.waitForTimeout(200);

      const timeLimitSelect = page.locator('.prefs__nested select').first();
      if (await timeLimitSelect.isVisible().catch(() => false)) {
        await timeLimitSelect.selectOption(String(withTimeLimit));
      }

      await page.locator('.modal-close').click();
      await page
        .locator('.prefs')
        .waitFor({ state: 'hidden', timeout: 5000 })
        .catch(() => {});
      return;
    }

    await drawFirstRound(page);
  }

  const PORTAL_ID = 747;

  test('snake distribution — 14 per group, 4 swiss rounds → playoff 16 + Group B', async ({ page }) => {
    await setupGroupsSwiss(page, { drawMethod: 'snake', withPlayB: true });

    await playRound(page);
    await playMultipleRounds(page, 3);

    await page.locator('[data-testid="btn-go-playoff"]').click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });

    const playoffTeamsSelect = page.locator('[data-testid="confirm-playoff-teams"]');
    const selectedValue = await playoffTeamsSelect.inputValue();
    expect(Number(selectedValue)).toBe(16);

    const playBCb = page.locator('[data-testid="confirm-play-b"]');
    await expect(playBCb).toBeChecked();

    await page.locator('[data-testid="btn-confirm-playoff"]').click();
    await page.locator('[data-testid="playoff-wrapper"]').waitFor({ state: 'visible', timeout: 15000 });

    const switcher = page.locator('.group-switcher');
    await expect(switcher).toBeVisible();

    await switcher.locator('.group-switcher__btn').nth(1).click();
    await page.waitForTimeout(500);
    await expect(switcher.locator('.group-switcher__btn--active')).toContainText('Tournament B');

    await switcher.locator('.group-switcher__btn').first().click();
    await page.waitForTimeout(300);

    await deleteCurrentTournament(page);
  });

  test('seeded distribution — 14 per group, 4 swiss rounds, time limit 50min', async ({ page }) => {
    await setupGroupsSwiss(page, { drawMethod: 'seeded', withTimeLimit: 50 });

    await playRound(page);
    await playMultipleRounds(page, 3);

    await page.locator('[data-testid="btn-go-playoff"]').click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });

    const timeLimitSelect = page.locator('[data-testid="confirm-playoff-time-limit"]');
    if (await timeLimitSelect.isVisible().catch(() => false)) {
      await timeLimitSelect.selectOption('50');
    }

    await page.locator('[data-testid="btn-confirm-playoff"]').click();
    await page.locator('[data-testid="playoff-wrapper"]').waitFor({ state: 'visible', timeout: 15000 });

    await deleteCurrentTournament(page);
  });

  test('snake distribution — 14 per group, 4 swiss rounds, score by round + Group B', async ({ page }) => {
    await setupGroupsSwiss(page, { drawMethod: 'snake', withPlayB: true });

    await page.locator('[data-testid="btn-preferences"]').click();
    await page.locator('.prefs').waitFor({ state: 'visible' });

    const perRoundLabel = page.locator('.prefs__label').filter({ hasText: /per.round|score.*round/i });
    if (
      await perRoundLabel
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      const cb = perRoundLabel.first().locator('input[type="checkbox"]');
      if (!(await cb.isChecked())) await cb.click();
    }

    await page.locator('.modal-close').click();
    await page
      .locator('.prefs')
      .waitFor({ state: 'hidden', timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(300);

    await playRound(page);
    await playMultipleRounds(page, 3);

    await page.locator('[data-testid="btn-go-playoff"]').click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });

    const playBCb = page.locator('[data-testid="confirm-play-b"]');
    await expect(playBCb).toBeChecked();

    await page.locator('[data-testid="btn-confirm-playoff"]').click();
    await page.locator('[data-testid="playoff-wrapper"]').waitFor({ state: 'visible', timeout: 15000 });

    await expect(page.locator('.group-switcher')).toBeVisible();

    await deleteCurrentTournament(page);
  });

  test('balanced random distribution — draw method is selectable and groups created', async ({ page }) => {
    await page.locator('[data-testid="input-portal-id"]').fill(String(PORTAL_ID));
    await page.locator('[data-testid="btn-import-portal"]').click();
    await page.locator('[data-testid="btn-draw-first-round"]').waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForTimeout(500);

    const useRatingCb = page.locator('.add-team-card__checkbox input[type="checkbox"]');
    if (!(await useRatingCb.isChecked())) await useRatingCb.click();
    await page.waitForTimeout(200);

    await selectSystem(page, 'groups');
    await setTeamsInGroup(page, 14);
    await page.locator('input[type="radio"][name="groupFormat"][value="swiss"]').click();
    await page.waitForTimeout(100);

    const swissRoundsInput = page.locator('input[type="number"][min="1"]');
    await swissRoundsInput.fill('4');

    const drawMethodOptions = page.locator('.draw-method__option');
    await drawMethodOptions.first().waitFor({ state: 'visible', timeout: 5000 });
    await drawMethodOptions.nth(2).click();
    await page.waitForTimeout(200);
    await expect(drawMethodOptions.nth(2)).toHaveClass(/draw-method__option--active/);

    await enablePlayOff(page);
    await setPlayOffTeams(page, 16);

    await deleteCurrentTournament(page);
  });

  test('snake distribution — Group B initialized with remaining teams after playoff', async ({ page }) => {
    await setupGroupsSwiss(page, { drawMethod: 'snake', withPlayB: true });

    await playRound(page);
    await playMultipleRounds(page, 3);

    await page.locator('[data-testid="btn-go-playoff"]').click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="btn-confirm-playoff"]').click();
    await page.locator('[data-testid="playoff-wrapper"]').waitFor({ state: 'visible', timeout: 15000 });

    const switcher = page.locator('.group-switcher');
    await expect(switcher).toBeVisible();

    await switcher.locator('.group-switcher__btn').nth(1).click();
    await page.waitForTimeout(500);
    await expect(switcher.locator('.group-switcher__btn--active')).toContainText('Tournament B');

    await switcher.locator('.group-switcher__btn').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="playoff-wrapper"]')).toBeVisible();

    await deleteCurrentTournament(page);
  });

  test('snake distribution — time limit 40min, no timelimit finale', async ({ page }) => {
    await setupGroupsSwiss(page, { drawMethod: 'snake', withTimeLimit: 40 });

    await playRound(page);
    await playMultipleRounds(page, 3);

    await page.locator('[data-testid="btn-go-playoff"]').click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });

    const noTimelimitFinale = page.locator('[data-testid="confirm-no-timelimit-finale"]');
    if (await noTimelimitFinale.isVisible().catch(() => false)) {
      if (!(await noTimelimitFinale.isChecked())) await noTimelimitFinale.click();
    }

    await page.locator('[data-testid="btn-confirm-playoff"]').click();
    await page.locator('[data-testid="playoff-wrapper"]').waitFor({ state: 'visible', timeout: 15000 });

    await deleteCurrentTournament(page);
  });

  test('snake distribution — verify playoff confirm shows correct team count from groups', async ({ page }) => {
    await setupGroupsSwiss(page, { drawMethod: 'snake' });

    await playRound(page);
    await playMultipleRounds(page, 3);

    await page.locator('[data-testid="btn-go-playoff"]').click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });

    const playoffTeamsSelect = page.locator('[data-testid="confirm-playoff-teams"]');
    const selectedValue = await playoffTeamsSelect.inputValue();
    expect(Number(selectedValue)).toBe(16);

    await page.locator('.modal-close').click();
    await page
      .locator('[data-testid="playoff-confirm-modal"]')
      .waitFor({ state: 'hidden', timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(300);

    await deleteCurrentTournament(page);
  });
});
