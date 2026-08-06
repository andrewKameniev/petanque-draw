import { expect, test } from '@playwright/test';

const scenarios = ['loader', 'nav', 'tir', 'timer', 'shell', 'scroll'];
const themes = ['light', 'dark'];

for (const scenario of scenarios) {
  for (const theme of themes) {
    test(`${scenario} ${theme} desktop`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/?scenario=${scenario}&theme=${theme}`);
      await expect(page.locator('.visual-page')).toHaveAttribute('data-scenario', scenario);
      await expect(page).toHaveScreenshot(`${scenario}-${theme}-desktop.png`, {
        animations: 'disabled',
        caret: 'hide',
        fullPage: true,
      });
    });
  }

  test(`${scenario} light mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/?scenario=${scenario}&theme=light`);
    await expect(page.locator('.visual-page')).toHaveAttribute('data-scenario', scenario);
    await expect(page).toHaveScreenshot(`${scenario}-light-mobile.png`, {
      animations: 'disabled',
      caret: 'hide',
      fullPage: true,
    });
  });
}

test('navigation keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/?scenario=nav&theme=light');
  await page.getByRole('tab', { name: 'Teams' }).focus();
  await expect(page).toHaveScreenshot('nav-keyboard-focus-light-desktop.png', {
    animations: 'disabled',
    caret: 'hide',
    fullPage: true,
  });
});
