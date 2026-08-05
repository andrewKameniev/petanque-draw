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

  test('TournamentNav: keyboard accessible tabs (ArrowLeft, ArrowRight, Home, End)', async ({ page }) => {
    await ensureCleanTournament(page);
    await addTeams(page, 8);
    await drawFirstRound(page);

    const tabs = page.getByRole('tablist', { name: 'Tournament sections' });
    await expect(tabs).toBeVisible();

    // Verify active tab has aria-selected
    const activeTab = tabs.locator('[role="tab"][aria-selected="true"]');
    await expect(activeTab).toBeVisible();

    // Home key navigates to first tab
    await activeTab.focus();
    await activeTab.press('Home');
    await expect(tabs.locator('#tab-teams')).toHaveAttribute('aria-selected', 'true');

    // End key navigates to last tab
    await tabs.locator('#tab-teams').press('End');
    await expect(tabs.locator('#tab-streams')).toHaveAttribute('aria-selected', 'true');

    // ArrowLeft wraps from non-first position
    await tabs.locator('#tab-streams').press('ArrowLeft');
    await expect(tabs.locator('#tab-ranking')).toHaveAttribute('aria-selected', 'true');

    // ArrowRight from middle
    await tabs.locator('#tab-ranking').press('ArrowRight');
    await expect(tabs.locator('#tab-streams')).toHaveAttribute('aria-selected', 'true');
  });

  test('RoundTimerControls: running/paused/ended states and start action', async ({ page }) => {
    await ensureCleanTournament(page);
    await addTeams(page, 8);
    await page.evaluate(() => {
      const app = document.querySelector('#app').__vue_app__;
      const store = app.config.globalProperties.$pinia._s.get('main');
      const tournament = store.currentTournament.main || store.currentTournament;
      tournament.preferences.timeLimitEnabled = true;
    });
    await drawFirstRound(page);

    // Navigate to games tab
    const tabs = page.getByRole('tablist', { name: 'Tournament sections' });
    await tabs.locator('#tab-games').click();

    // Start button visible
    const startTimer = page.locator('.round-timer-controls__start');
    await expect(startTimer).toBeVisible();

    // Click start -> running state (timer element appears)
    await startTimer.click();
    const timer = page.locator('.round-timer');
    await expect(timer).toHaveAttribute('role', 'button');

    // Pause -> paused state
    await timer.focus();
    await timer.press('Enter');
    await expect(page.locator('.round-timer__restart')).toBeVisible();
  });

  test('PublicPageShell and PageLoader: desktop light/dark', async ({ page }) => {
    await ensureCleanTournament(page);
    await addTeams(page, 8);
    await drawFirstRound(page);
    const tournamentRef = await getPublicTournamentRef(page);

    // Desktop viewport (1280px)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/#/tournament?ref=${tournamentRef}`);
    const shell = page.locator('.public-page-shell');
    const tabs = page.getByRole('tablist', { name: 'Tournament sections' });
    await expect(shell).toBeVisible();
    await expect(tabs).toBeVisible();

    // Light theme: texture background present
    const lightTexture = await shell.evaluate(
      (element) => window.getComputedStyle(element, '::before').backgroundImage,
    );
    expect(lightTexture).toContain('bg-petanque');

    // Dark theme: texture hidden
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const darkTextureDisplay = await shell.evaluate((element) => window.getComputedStyle(element, '::before').display);
    expect(darkTextureDisplay).toBe('none');

    // PageLoader is accessible
    await shell.evaluate((element) => {
      let instance = element.__vueParentComponent;
      while (instance && instance.type?.name !== 'Public') instance = instance.parent;
      instance.proxy.isLoading = true;
    });
    const loader = page.getByRole('status', { name: 'Loading…' });
    await expect(loader).toBeVisible();
    await expect(loader.locator('.visually-hidden')).toHaveText('Loading…');
  });

  test('PublicPageShell: mobile viewport (375px) and responsive layout', async ({ page }) => {
    await ensureCleanTournament(page);
    await addTeams(page, 8);
    await drawFirstRound(page);
    const tournamentRef = await getPublicTournamentRef(page);

    // Mobile viewport (375px)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/#/tournament?ref=${tournamentRef}`);
    const shell = page.locator('.public-page-shell');
    const tabs = page.getByRole('tablist', { name: 'Tournament sections' });
    await expect(shell).toBeVisible();
    await expect(tabs).toBeVisible();

    // No horizontal overflow
    const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(fitsViewport).toBe(true);
  });

  test('TournamentNav: different tab sets on desktop', async ({ page }) => {
    await ensureCleanTournament(page);
    await addTeams(page, 8);
    await drawFirstRound(page);

    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    const tabs = page.getByRole('tablist', { name: 'Tournament sections' });

    // Admin view has multiple tabs
    const tabButtons = tabs.locator('[role="tab"]');
    const tabCount = await tabButtons.count();
    expect(tabCount).toBeGreaterThanOrEqual(4);

    // Click each tab and verify aria-selected updates
    for (let i = 0; i < Math.min(tabCount, 3); i++) {
      await tabButtons.nth(i).click();
      await expect(tabButtons.nth(i)).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('Tir scoring controls: atelier tabs, score grid, cards on desktop', async ({ page }) => {
    await ensureCleanTournament(page);
    await page.goto('/#/training');
    await expect(page.locator('.training-tabs')).toBeVisible();

    await page.locator('.training-content').evaluate((element) => {
      let instance = element.__vueParentComponent;
      while (instance && instance.type?.name !== 'Training') instance = instance.parent;
      instance.proxy.activeSession = {
        id: 'e2e-desktop-scoring',
        name: 'Desktop scoring QA',
        type: 'tir_custom',
        status: 'draft',
        config: { exercises: [0, 1], distances: [6, 7], attempts: 4 },
        attempts: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      instance.proxy.view = 'session';
    });

    // Desktop viewport (1280px)
    await page.setViewportSize({ width: 1280, height: 800 });

    // Legend, cards, atelier tabs, score circles all visible
    await expect(page.locator('.tir-score-legend')).toBeVisible();
    await expect(page.locator('.tir-scoring-card')).toHaveCount(1);
    await expect(page.locator('.tir-atelier-tabs__tab')).toHaveCount(2);
    await expect(page.locator('button.tir-score-circle')).toHaveCount(32);
    await expect(page.locator('button.tir-score-circle').first()).toHaveAttribute('aria-pressed', 'false');

    // Atelier tab keyboard navigation
    const atelierTabs = page.locator('.tir-atelier-tabs');
    await atelierTabs.locator('[role="tab"]').first().focus();
    await atelierTabs.locator('[role="tab"]').first().press('ArrowRight');
    await expect(atelierTabs.locator('#training-atelier-1')).toHaveAttribute('aria-selected', 'true');
  });

  test('Tir scoring controls: multiple cards and circles on mobile', async ({ page }) => {
    await ensureCleanTournament(page);
    await page.goto('/#/training');
    await expect(page.locator('.training-tabs')).toBeVisible();

    await page.locator('.training-content').evaluate((element) => {
      let instance = element.__vueParentComponent;
      while (instance && instance.type?.name !== 'Training') instance = instance.parent;
      instance.proxy.activeSession = {
        id: 'e2e-mobile-scoring',
        name: 'Mobile scoring QA',
        type: 'tir_custom',
        status: 'draft',
        config: { exercises: [0, 1], distances: [6, 7], attempts: 2 },
        attempts: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      instance.proxy.view = 'session';
    });

    // Mobile viewport (375px)
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.locator('.tsession')).toBeVisible();

    // When attempts <= exercises, show multiple cards without atelier tabs
    await expect(page.locator('.tir-atelier-tabs')).toHaveCount(0);
    await expect(page.locator('.tir-scoring-card')).toHaveCount(2);
    await expect(page.locator('button.tir-score-circle')).toHaveCount(32);

    // No horizontal overflow on mobile
    const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(fitsViewport).toBe(true);
  });

  test('Tir scoring cards: light/dark theme background changes', async ({ page }) => {
    await ensureCleanTournament(page);
    await page.goto('/#/training');
    await expect(page.locator('.training-tabs')).toBeVisible();

    await page.locator('.training-content').evaluate((element) => {
      let instance = element.__vueParentComponent;
      while (instance && instance.type?.name !== 'Training') instance = instance.parent;
      instance.proxy.activeSession = {
        id: 'e2e-theme-scoring',
        name: 'Theme scoring QA',
        type: 'tir_custom',
        status: 'draft',
        config: { exercises: [0], distances: [6, 7], attempts: 2 },
        attempts: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      instance.proxy.view = 'session';
    });

    await expect(page.locator('.tir-scoring-card').first()).toBeVisible();

    // Get light theme card background
    const lightCardBackground = await page
      .locator('.tir-scoring-card')
      .first()
      .evaluate((element) => window.getComputedStyle(element).backgroundColor);

    // Switch to dark theme
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Dark theme card background should differ
    const darkCardBackground = await page
      .locator('.tir-scoring-card')
      .first()
      .evaluate((element) => window.getComputedStyle(element).backgroundColor);
    expect(darkCardBackground).not.toBe(lightCardBackground);
  });
});
