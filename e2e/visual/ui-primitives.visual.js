import { expect, test } from '@playwright/test';

const desktop = { width: 1280, height: 800 };
const mobile = { width: 375, height: 812 };

const loaderCases = [
  { theme: 'light', viewport: desktop, snapshot: 'loader-light-desktop.png' },
  { theme: 'dark', viewport: desktop, snapshot: 'loader-dark-desktop.png' },
  { theme: 'light', viewport: mobile, snapshot: 'loader-light-mobile.png' },
  { theme: 'dark', viewport: mobile, snapshot: 'loader-dark-mobile.png' },
].map((entry) => ({ scenario: 'loader', capture: 'page', ...entry }));

const navCases = [
  {
    fixture: 'tournament',
    theme: 'light',
    viewport: desktop,
    snapshot: 'nav-tournament-default-light-desktop.png',
  },
  {
    fixture: 'tournament',
    theme: 'light',
    viewport: desktop,
    focusName: 'Results',
    snapshot: 'nav-tournament-focus-light-desktop.png',
  },
  {
    fixture: 'public',
    theme: 'dark',
    viewport: desktop,
    snapshot: 'nav-public-default-dark-desktop.png',
  },
  {
    fixture: 'public',
    theme: 'dark',
    viewport: desktop,
    focusName: 'Round',
    snapshot: 'nav-public-focus-dark-desktop.png',
  },
  {
    fixture: 'archived',
    theme: 'light',
    viewport: mobile,
    snapshot: 'nav-archived-default-light-mobile.png',
  },
  {
    fixture: 'archived',
    theme: 'light',
    viewport: mobile,
    focusName: 'Overview',
    snapshot: 'nav-archived-focus-light-mobile.png',
  },
  {
    fixture: 'tir',
    theme: 'dark',
    viewport: mobile,
    snapshot: 'nav-tir-default-dark-mobile.png',
  },
  {
    fixture: 'tir',
    theme: 'dark',
    viewport: mobile,
    focusName: 'Scoring',
    snapshot: 'nav-tir-focus-dark-mobile.png',
  },
].map((entry) => ({ scenario: 'nav', capture: '.visual-canvas--nav', ...entry }));

const tirCases = [
  {
    fixture: 'participant',
    theme: 'light',
    viewport: desktop,
    snapshot: 'tir-participant-editable-light-desktop.png',
  },
  {
    fixture: 'atelier',
    theme: 'dark',
    viewport: desktop,
    expandAtelierParticipant: true,
    snapshot: 'tir-atelier-editable-dark-desktop.png',
  },
  {
    fixture: 'public',
    theme: 'light',
    viewport: mobile,
    snapshot: 'tir-public-read-only-light-mobile.png',
  },
  {
    fixture: 'playoff',
    theme: 'dark',
    viewport: desktop,
    snapshot: 'tir-playoff-comparison-dark-desktop.png',
  },
  {
    fixture: 'training',
    theme: 'dark',
    viewport: mobile,
    snapshot: 'tir-training-dark-mobile.png',
  },
].map((entry) => ({ scenario: 'tir', capture: '.visual-canvas--tir', ...entry }));

const timerCases = [
  {
    state: 'not-started',
    theme: 'light',
    viewport: desktop,
    snapshot: 'timer-not-started-light-desktop.png',
  },
  {
    state: 'running',
    theme: 'light',
    viewport: desktop,
    snapshot: 'timer-running-light-desktop.png',
  },
  {
    state: 'paused',
    theme: 'dark',
    viewport: desktop,
    snapshot: 'timer-paused-dark-desktop.png',
  },
  {
    state: 'ended',
    theme: 'light',
    viewport: mobile,
    snapshot: 'timer-ended-light-mobile.png',
  },
  {
    state: 'restart-open',
    theme: 'light',
    viewport: mobile,
    openRestart: true,
    snapshot: 'timer-restart-open-light-mobile.png',
  },
  {
    state: 'read-only',
    theme: 'dark',
    viewport: mobile,
    snapshot: 'timer-read-only-dark-mobile.png',
  },
].map((entry) => ({ scenario: 'timer', capture: '.visual-canvas--timer', ...entry }));

const shellCases = [
  {
    fixture: 'public',
    theme: 'light',
    viewport: desktop,
    snapshot: 'shell-public-responsive-light-desktop.png',
  },
  {
    fixture: 'public',
    theme: 'dark',
    viewport: mobile,
    snapshot: 'shell-public-responsive-dark-mobile.png',
  },
  {
    fixture: 'public-stats',
    theme: 'dark',
    viewport: desktop,
    snapshot: 'shell-public-stats-compact-dark-desktop.png',
  },
  {
    fixture: 'archived',
    theme: 'light',
    viewport: mobile,
    snapshot: 'shell-archived-plain-light-mobile.png',
  },
].map((entry) => ({ scenario: 'shell', capture: '.visual-shell', ...entry }));

const scrollCases = [
  {
    fixture: 'container',
    theme: 'light',
    viewport: desktop,
    snapshot: 'scroll-container-default-light-desktop.png',
  },
  {
    fixture: 'container',
    theme: 'light',
    viewport: desktop,
    focusName: 'Scroll to top',
    snapshot: 'scroll-container-focus-light-desktop.png',
  },
  {
    fixture: 'window',
    theme: 'dark',
    viewport: mobile,
    snapshot: 'scroll-window-default-dark-mobile.png',
  },
  {
    fixture: 'window',
    theme: 'dark',
    viewport: mobile,
    focusName: 'Scroll to top',
    snapshot: 'scroll-window-focus-dark-mobile.png',
  },
].map((entry) => ({ scenario: 'scroll', capture: 'page', ...entry }));

const matrix = [...loaderCases, ...navCases, ...tirCases, ...timerCases, ...shellCases, ...scrollCases];

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-08-06T12:00:00.000Z') });
  await page.route('**/*', async (route) => {
    const host = new URL(route.request().url()).hostname;
    if (host === '127.0.0.1' || host === 'localhost') await route.continue();
    else await route.abort('blockedbyclient');
  });
});

for (const visualCase of matrix) {
  test(visualCase.snapshot.replace('.png', ''), async ({ page }) => {
    await page.setViewportSize(visualCase.viewport);

    const query = new URLSearchParams({ scenario: visualCase.scenario, theme: visualCase.theme });
    if (visualCase.fixture) query.set('fixture', visualCase.fixture);
    if (visualCase.state) query.set('state', visualCase.state);
    await page.goto(`/?${query}`);

    const harness = page.getByTestId('visual-fixture');
    await expect(harness).toHaveAttribute('data-scenario', visualCase.scenario);
    if (visualCase.fixture) await expect(harness).toHaveAttribute('data-fixture', visualCase.fixture);
    if (visualCase.state) await expect(harness).toHaveAttribute('data-state', visualCase.state);

    if (visualCase.expandAtelierParticipant) {
      const participant = page.locator('.tir-aview__row-header').first();
      await participant.click();
      await expect(participant).toHaveAttribute('aria-expanded', 'true');
    }

    if (visualCase.openRestart) {
      await page.getByRole('button', { name: 'Restart timer: 2:05' }).click();
      await expect(page.locator('.round-timer__restart')).toBeVisible();
    }

    if (visualCase.focusName) {
      const control = page.getByRole(visualCase.scenario === 'nav' ? 'tab' : 'button', {
        name: visualCase.focusName,
      });
      await control.focus();
      await expect(control).toBeFocused();
    }

    const screenshotOptions = {
      animations: 'disabled',
      caret: 'hide',
    };
    if (visualCase.capture === 'page') {
      await expect(page).toHaveScreenshot(visualCase.snapshot, { ...screenshotOptions, fullPage: false });
    } else {
      await expect(page.locator(visualCase.capture)).toHaveScreenshot(visualCase.snapshot, screenshotOptions);
    }
  });
}
