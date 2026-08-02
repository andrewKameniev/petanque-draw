import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Archived tournament layout', () => {
  test('places management buttons in a separate bottom sidebar row', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await login(page);
    await page.goto('/#/archived');

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
  });
});
