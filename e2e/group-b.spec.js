import { test, expect } from '@playwright/test';
import {
  ensureCleanTournament,
  addTeams,
  drawFirstRound,
  playRound,
  playMultipleRounds,
  enablePlayOff,
  enableCadrage,
  enablePlayB,
  setPlayOffTeams,
  deleteCurrentTournament,
  fillCadrageScores,
  saveCadrageAndStartPlayOff,
} from './helpers';

test.describe('Group B Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('petanqueDrawLang', 'en'));
    await ensureCleanTournament(page);
  });

  test('8 teams — swiss + playoff with Group B switcher appears', async ({ page }) => {
    await addTeams(page, 8);
    await enablePlayOff(page);
    await setPlayOffTeams(page, 4);
    await enablePlayB(page);
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 2);

    // Open playoff confirm modal
    await page.locator('[data-testid="btn-go-playoff"]').click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });

    // Verify playB is checked
    const playBCheckbox = page.locator('[data-testid="confirm-play-b"]');
    await expect(playBCheckbox).toBeChecked();

    // Confirm playoff
    await page.locator('[data-testid="btn-confirm-playoff"]').click();

    // Wait for playoff to start
    await page.locator('[data-testid="playoff-wrapper"]').waitFor({ state: 'visible' });

    // Group switcher should be visible
    const switcher = page.locator('.group-switcher');
    await expect(switcher).toBeVisible();

    // Button A should be active
    const btnA = switcher.locator('.group-switcher__btn--active');
    await expect(btnA).toContainText('Main tournament');

    // Switch to Group B
    const btnB = switcher.locator('.group-switcher__btn').nth(1);
    await btnB.click();
    await page.waitForTimeout(300);

    // Now B should be active
    await expect(switcher.locator('.group-switcher__btn--active')).toContainText('Tournament B');

    // The wrapper-level active group and B data survive a full resubscription.
    await page.reload();
    await expect(switcher).toBeVisible();
    await expect(switcher.locator('.group-switcher__btn--active')).toContainText('Tournament B');

    // Switch back to A for cleanup
    await switcher.locator('.group-switcher__btn').first().click();
    await page.waitForTimeout(300);

    await deleteCurrentTournament(page);
  });

  test('playoff confirm modal — withdrawal toggle', async ({ page }) => {
    await addTeams(page, 8);
    await enablePlayOff(page);
    await setPlayOffTeams(page, 4);
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 2);

    // Open playoff confirm modal
    await page.locator('[data-testid="btn-go-playoff"]').click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });

    // Open advanced settings
    await page.locator('.confirm-playoff__collapse-toggle').click();
    await page.waitForTimeout(200);

    // Withdrawal list should be visible
    const withdrawList = page.locator('.confirm-playoff__withdraw-list');
    await expect(withdrawList).toBeVisible();

    // Click withdraw button on first team
    const firstWithdrawBtn = withdrawList.locator('.confirm-playoff__withdraw-btn').first();
    await firstWithdrawBtn.click();
    await page.waitForTimeout(200);

    // First item should have withdrawn class
    const firstItem = withdrawList.locator('.confirm-playoff__withdraw-item').first();
    await expect(firstItem).toHaveClass(/confirm-playoff__withdraw-item--wd/);

    // Undo withdrawal
    await firstWithdrawBtn.click();
    await page.waitForTimeout(200);
    await expect(firstItem).not.toHaveClass(/confirm-playoff__withdraw-item--wd/);

    // Cancel and cleanup
    await page.locator('.confirm-playoff__btn--cancel').click();
    await deleteCurrentTournament(page);
  });

  test('playoff confirm modal — cadrage losers to B option', async ({ page }) => {
    await addTeams(page, 16);
    await enablePlayOff(page);
    await setPlayOffTeams(page, 8);
    await enableCadrage(page);
    await enablePlayB(page);
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 2);

    // Open playoff confirm modal
    await page.locator('[data-testid="btn-go-playoff"]').click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });

    // Verify cadrage and playB are checked
    await expect(page.locator('[data-testid="confirm-cadrage"]')).toBeChecked();
    await expect(page.locator('[data-testid="confirm-play-b"]')).toBeChecked();

    // Open advanced settings
    await page.locator('.confirm-playoff__collapse-toggle').click();
    await page.waitForTimeout(200);

    // Cadrage losers to B checkbox should be visible
    const cadrageLosersLabel = page.locator('text=Cadrage losers go to Group B');
    await expect(cadrageLosersLabel).toBeVisible();

    // Legend should be visible
    const legend = page.locator('.confirm-playoff__legend');
    await expect(legend).toBeVisible();
    await expect(legend).toContainText('Tournament B');
    await expect(legend).toContainText('Total in B');

    // Cancel and cleanup
    await page.locator('.confirm-playoff__btn--cancel').click();
    await deleteCurrentTournament(page);
  });

  test('playoff confirm modal — elimination round option', async ({ page }) => {
    await addTeams(page, 16);
    await enablePlayOff(page);
    await setPlayOffTeams(page, 8);
    await enablePlayB(page);
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 2);

    // Open playoff confirm modal
    await page.locator('[data-testid="btn-go-playoff"]').click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });

    // Open advanced settings
    await page.locator('.confirm-playoff__collapse-toggle').click();
    await page.waitForTimeout(200);

    // Enable elimination round
    const elimCheckbox = page.locator('[data-testid="confirm-elimination"]');
    await expect(elimCheckbox).toBeVisible();
    await elimCheckbox.click();
    await page.waitForTimeout(200);

    // Elimination count select should appear
    const elimCountSelect = page.locator('[data-testid="confirm-elimination-count"]');
    await expect(elimCountSelect).toBeVisible();

    // Legend should show elimination entry
    const legend = page.locator('.confirm-playoff__legend');
    await expect(legend).toContainText('Elimination round');

    // Cancel and cleanup
    await page.locator('.confirm-playoff__btn--cancel').click();
    await deleteCurrentTournament(page);
  });

  test('16 teams — swiss + cadrage + playoff + Group B with cadrage losers', async ({ page }) => {
    await addTeams(page, 16);
    await enablePlayOff(page);
    await setPlayOffTeams(page, 8);
    await enableCadrage(page);
    await enablePlayB(page);
    await drawFirstRound(page);
    await playRound(page);
    await playMultipleRounds(page, 2);

    // Open playoff confirm and enable cadrage losers to B
    await page.locator('[data-testid="btn-go-playoff"]').click();
    await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });

    // Open advanced, enable cadrage losers
    await page.locator('.confirm-playoff__collapse-toggle').click();
    await page.waitForTimeout(200);

    const cadrageLosersCheckbox = page.locator('.confirm-playoff__checkbox--sub input[type="checkbox"]').first();
    await cadrageLosersCheckbox.click();
    await page.waitForTimeout(100);

    // Confirm — should go to cadrage
    await page.locator('[data-testid="btn-confirm-playoff"]').click();
    await page.locator('[data-testid="cadrage-heading"]').waitFor({ state: 'visible' });

    // Fill cadrage scores and start playoff
    await fillCadrageScores(page);
    await saveCadrageAndStartPlayOff(page);

    // Playoff should be visible
    await expect(page.locator('[data-testid="playoff-wrapper"]')).toBeVisible();

    // Group switcher should be visible (cadrage losers went to B)
    const switcher = page.locator('.group-switcher');
    await expect(switcher).toBeVisible();

    await deleteCurrentTournament(page);
  });
});
