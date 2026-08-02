import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Navbar', () => {
  test('keeps the user menu above a composited content image', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await login(page);

    const contentImage = page.locator('img[alt="Petanque in Alps"]');
    await expect(contentImage).toBeVisible();

    // Reproduce the separate image layer that could intermittently paint above the menu.
    await contentImage.evaluate((image) => {
      image.style.transform = 'translateZ(0)';
      image.style.zIndex = '1000';
    });

    await page.locator('.btn-user').click();
    const menu = page.locator('.user-dropdown__menu');
    await expect(menu).toBeVisible();

    const menuIsTopmost = await page.evaluate(() => {
      const dropdown = document.querySelector('.user-dropdown__menu');
      const image = document.querySelector('img[alt="Petanque in Alps"]');
      if (!dropdown || !image) return false;

      const menuRect = dropdown.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      const overlapLeft = Math.max(menuRect.left, imageRect.left);
      const overlapRight = Math.min(menuRect.right, imageRect.right);
      const overlapTop = Math.max(menuRect.top, imageRect.top);
      const overlapBottom = Math.min(menuRect.bottom, imageRect.bottom);
      if (overlapLeft >= overlapRight || overlapTop >= overlapBottom) return false;

      const topElement = document.elementFromPoint((overlapLeft + overlapRight) / 2, (overlapTop + overlapBottom) / 2);
      return Boolean(topElement?.closest('.user-dropdown__menu'));
    });

    expect(menuIsTopmost).toBe(true);
  });
});
