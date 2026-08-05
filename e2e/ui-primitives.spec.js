import { test, expect } from '@playwright/test';
import { addTeams, deleteCurrentTournament, drawFirstRound, ensureCleanTournament } from './helpers';

async function getPublicTournamentRef(page) {
  return page.evaluate(() => {
    const app = document.querySelector('#app').__vue_app__;
    const store = app.config.globalProperties.$pinia._s.get('main');
    return `${store.user.uid}.${Number(store.currentTournamentIndex).toString(36)}`;
  });
}

test.describe('Shared UI primitives', () => {
  test.describe.configure({ timeout: 60000 });

  test.afterEach(async ({ page }) => {
    await page.goto('/#/');
    await deleteCurrentTournament(page);
  });

  test('keeps tabs and round timer keyboard accessible', async ({ page }) => {
    await ensureCleanTournament(page);
    await addTeams(page, 8);
    await page.evaluate(() => {
      const app = document.querySelector('#app').__vue_app__;
      const store = app.config.globalProperties.$pinia._s.get('main');
      const tournament = store.currentTournament.main || store.currentTournament;
      tournament.preferences.timeLimitEnabled = true;
    });
    await drawFirstRound(page);

    const tabs = page.getByRole('tablist', { name: 'Tournament sections' });
    await expect(tabs).toBeVisible();

    const activeTab = tabs.locator('[role="tab"][aria-selected="true"]');
    await activeTab.focus();
    await activeTab.press('Home');
    await expect(tabs.locator('#tab-teams')).toHaveAttribute('aria-selected', 'true');
    await tabs.locator('#tab-teams').press('End');
    await expect(tabs.locator('#tab-streams')).toHaveAttribute('aria-selected', 'true');
    await tabs.locator('#tab-streams').press('ArrowLeft');
    await expect(tabs.locator('#tab-ranking')).toHaveAttribute('aria-selected', 'true');

    await tabs.locator('#tab-games').click();
    const startTimer = page.locator('.round-timer-controls__start');
    await expect(startTimer).toBeVisible();
    await startTimer.click();

    const timer = page.locator('.round-timer');
    await expect(timer).toHaveAttribute('role', 'button');
    await timer.focus();
    await timer.press('Enter');
    await expect(page.locator('.round-timer__restart')).toBeVisible();
  });

  test('keeps the public shell, loader, and tabs stable across themes and mobile', async ({ page }) => {
    await ensureCleanTournament(page);
    await addTeams(page, 8);
    await drawFirstRound(page);
    const tournamentRef = await getPublicTournamentRef(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/#/tournament?ref=${tournamentRef}`);
    const shell = page.locator('.public-page-shell');
    const tabs = page.getByRole('tablist', { name: 'Tournament sections' });
    await expect(shell).toBeVisible();
    await expect(tabs).toBeVisible();

    const lightTexture = await shell.evaluate(
      (element) => window.getComputedStyle(element, '::before').backgroundImage,
    );
    expect(lightTexture).toContain('bg-petanque');

    await page.locator('.theme-switch').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const darkTextureDisplay = await shell.evaluate((element) => window.getComputedStyle(element, '::before').display);
    expect(darkTextureDisplay).toBe('none');

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(tabs).toBeVisible();
    const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(fitsViewport).toBe(true);

    await shell.evaluate((element) => {
      let instance = element.__vueParentComponent;
      while (instance && instance.type?.name !== 'Public') instance = instance.parent;
      instance.proxy.isLoading = true;
    });
    const loader = page.getByRole('status', { name: 'Loading…' });
    await expect(loader).toBeVisible();
    await expect(loader.locator('.visually-hidden')).toHaveText('Loading…');
  });

  test('uses the shared tir scoring controls in training on desktop and mobile', async ({ page }) => {
    await ensureCleanTournament(page);
    await page.goto('/#/training');
    await expect(page.locator('.training-tabs')).toBeVisible();

    await page.locator('.training-content').evaluate((element) => {
      let instance = element.__vueParentComponent;
      while (instance && instance.type?.name !== 'Training') instance = instance.parent;
      instance.proxy.activeSession = {
        id: 'e2e-shared-scoring',
        name: 'Shared scoring QA',
        type: 'tir_custom',
        status: 'draft',
        config: { exercises: [0], distances: [6, 7], attempts: 2 },
        attempts: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      instance.proxy.view = 'session';
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('.tir-score-legend')).toBeVisible();
    await expect(page.locator('button.tir-score-circle')).toHaveCount(16);
    await expect(page.locator('button.tir-score-circle').first()).toHaveAttribute('aria-pressed', 'false');

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.tsession')).toBeVisible();
    const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(fitsViewport).toBe(true);
  });
});
