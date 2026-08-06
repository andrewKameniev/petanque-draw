import { test, expect } from '@playwright/test';
import { assertBrowserEmulatorSentinel, login } from './helpers';
import { cleanupOwnedTournament, createFixtureId, seedOwnedTournament } from './firebase-fixtures';

async function useEnglish(page) {
  await page.addInitScript(() => localStorage.setItem('petanqueDrawLang', 'en'));
}

test.describe('Archived tournament layout', () => {
  test('@task11 exposes the archived nav and keeps management rows separate at each breakpoint', async ({ page }) => {
    const id = createFixtureId(60);
    await useEnglish(page);
    await page.goto('/#/');
    await assertBrowserEmulatorSentinel(page);
    await seedOwnedTournament(
      id,
      {
        name: 'Archived Layout Fixture',
        date: '2026-08-05',
        system: 'swiss',
        teams: [{ title: 'Layout A' }, { title: 'Layout B' }],
        games: [[{ team_1: 'Layout A', team_2: 'Layout B', team_1_score: 13, team_2_score: 8, status: 'finished' }]],
        tournamentIsFinished: true,
        preferences: {},
      },
      { status: 'archived' },
    );
    await login(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    try {
      await page.locator('.btn-user').click();
      await page.getByRole('link', { name: 'Archived tournaments' }).click();
      await expect(page).toHaveURL(/#\/archived$/);
      const archivedItem = page.locator(`.archived-sidebar__item[data-tournament-id="${id}"]`);
      await expect(archivedItem).toBeVisible({ timeout: 10_000 });
      await archivedItem.click();
      await expect(archivedItem).toHaveClass(/archived-sidebar__item--active/);

      const tablist = page.getByRole('tablist', { name: 'Tournament sections' });
      await expect(tablist).toBeVisible();
      await expect(tablist.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);
      await expect(tablist.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);

      const teamsTab = tablist.locator('#archived-tournament-tab-teams');
      const resultsTab = tablist.locator('#archived-tournament-tab-results');
      const rankingTab = tablist.locator('#archived-tournament-tab-ranking');
      await teamsTab.focus();
      await teamsTab.press('ArrowRight');
      await expect(resultsTab).toBeFocused();
      await expect(resultsTab).toHaveAttribute('aria-selected', 'true');
      await rankingTab.click();
      await expect(rankingTab).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('#archived-tournament-tabpanel')).toHaveAttribute(
        'aria-labelledby',
        'archived-tournament-tab-ranking',
      );

      const sidebarActions = page.locator('.archived-sidebar__actions');
      const linkRow = sidebarActions.locator('.sidebar-action-row--buttons:not(.sidebar-action-row--management)');
      const managementRow = sidebarActions.locator('.sidebar-action-row--management');

      await expect(sidebarActions).toBeVisible();
      await expect(managementRow.locator('.btn-make-active')).toBeVisible();
      await expect(managementRow.locator('.btn-remove-archived')).toBeVisible();
      await expect(page.locator('.tournament-selector__mobile-actions')).toBeHidden();

      const linkBox = await linkRow.boundingBox();
      const managementBox = await managementRow.boundingBox();
      expect(linkBox).not.toBeNull();
      expect(managementBox).not.toBeNull();
      expect(managementBox.y).toBeGreaterThanOrEqual(linkBox.y + linkBox.height);

      await page.setViewportSize({ width: 800, height: 720 });
      const mobileActions = page.locator('.tournament-selector__mobile-actions');
      await expect(sidebarActions).toBeHidden();
      await expect(mobileActions).toBeVisible();

      const titleBox = await page.locator('.tournament-selector__name').boundingBox();
      const mobileActionsBox = await mobileActions.boundingBox();
      expect(titleBox).not.toBeNull();
      expect(mobileActionsBox).not.toBeNull();
      expect(mobileActionsBox.y).toBeGreaterThanOrEqual(titleBox.y + titleBox.height);
    } finally {
      await cleanupOwnedTournament(id);
    }
  });
});
