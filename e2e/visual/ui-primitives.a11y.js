import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const scenarios = ['loader', 'nav', 'tir', 'timer', 'shell', 'scroll'];

const extendedHarnesses = [
  { name: 'tir participant editor', url: '/?scenario=tir&fixture=participant&theme=light' },
  {
    name: 'tir atelier editor',
    url: '/?scenario=tir&fixture=atelier&theme=dark',
    prepare: async (page) => {
      const participant = page.locator('.tir-aview__row-header').first();
      await participant.click();
      await expect(participant).toHaveAttribute('aria-expanded', 'true');
    },
  },
  { name: 'tir public read-only view', url: '/?scenario=tir&fixture=public&theme=light' },
  { name: 'tir playoff comparison', url: '/?scenario=tir&fixture=playoff&theme=dark' },
  { name: 'tir training view', url: '/?scenario=tir&fixture=training&theme=dark' },
  {
    name: 'timer restart panel',
    url: '/?scenario=timer&state=restart-open&theme=light',
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Restart timer: 2:05' }).click();
      await expect(page.locator('.round-timer__restart')).toBeVisible();
    },
  },
  { name: 'public responsive shell', url: '/?scenario=shell&fixture=public&theme=light' },
  { name: 'public statistics compact shell', url: '/?scenario=shell&fixture=public-stats&theme=dark' },
  { name: 'archived plain shell', url: '/?scenario=shell&fixture=archived&theme=light' },
];

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-08-06T12:00:00.000Z') });
  await page.route('**/*', async (route) => {
    const host = new URL(route.request().url()).hostname;
    if (host === '127.0.0.1' || host === 'localhost') await route.continue();
    else await route.abort('blockedbyclient');
  });
});

for (const scenario of scenarios) {
  test(`@a11y ${scenario} has no critical, serious, or unwaived moderate axe violations`, async ({ page }) => {
    await page.goto(`/?scenario=${scenario}&theme=light`);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const blocking = violations.filter(({ impact }) => ['critical', 'serious', 'moderate'].includes(impact));
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
}

for (const harness of extendedHarnesses) {
  test(`@a11y ${harness.name} has no critical, serious, or unwaived moderate axe violations`, async ({ page }) => {
    await page.goto(harness.url);
    await harness.prepare?.(page);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const blocking = violations.filter(({ impact }) => ['critical', 'serious', 'moderate'].includes(impact));
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
}

for (const theme of ['light', 'dark']) {
  test(`@a11y navigation exposes a visible ${theme} focus indicator`, async ({ page }) => {
    await page.goto(`/?scenario=nav&theme=${theme}`);
    const tab = page.getByRole('tab', { name: 'Teams' });
    await tab.focus();
    const focusStyle = await tab.evaluate((element) => {
      const parseRgb = (value) =>
        value
          .match(/[\d.]+/g)
          ?.slice(0, 3)
          .map(Number) ?? [];
      const luminance = (rgb) => {
        const channels = rgb.map((value) => {
          const normalized = value / 255;
          return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
      };
      const style = window.getComputedStyle(element);
      const background = window.getComputedStyle(element.closest('.tournament-nav')).backgroundColor;
      const foregroundLuminance = luminance(parseRgb(style.outlineColor));
      const backgroundLuminance = luminance(parseRgb(background));
      const contrast =
        (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
        (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
        contrast,
      };
    });
    expect(focusStyle.outlineStyle).not.toBe('none');
    expect(focusStyle.outlineWidth).toBeGreaterThanOrEqual(2);
    expect(focusStyle.contrast).toBeGreaterThanOrEqual(3);
  });

  test(`@a11y navigation text has 4.5:1 ${theme} contrast`, async ({ page }) => {
    await page.goto(`/?scenario=nav&theme=${theme}`);
    const contrasts = await page.locator('.tournament-nav__btn').evaluateAll((elements) => {
      const parseRgb = (value) =>
        value
          .match(/[\d.]+/g)
          ?.slice(0, 3)
          .map(Number) ?? [];
      const luminance = (rgb) => {
        const channels = rgb.map((value) => {
          const normalized = value / 255;
          return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
      };
      return elements.map((element) => {
        const foreground = luminance(parseRgb(window.getComputedStyle(element).color));
        const background = luminance(
          parseRgb(window.getComputedStyle(element.closest('.tournament-nav')).backgroundColor),
        );
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
    });
    expect(Math.min(...contrasts)).toBeGreaterThanOrEqual(4.5);
  });
}

test('@a11y loader exposes its single live text node as the status name', async ({ page }) => {
  await page.goto('/?scenario=loader&theme=light');
  const status = page.getByRole('status', { name: 'Loading tournament…' });
  await expect(status).toBeVisible();
  await expect(status.locator('.visually-hidden')).toHaveCount(1);
  await expect(status).not.toHaveAttribute('aria-label');
});

test('@a11y native Enter and Space activate a tab exactly once', async ({ page }) => {
  await page.goto('/?scenario=nav&theme=light');
  const fixture = page.locator('.visual-page');

  await page.getByRole('tab', { name: 'Games' }).focus();
  await page.getByRole('tab', { name: 'Games' }).press('Enter');
  await expect(page.getByRole('tab', { name: 'Games' })).toHaveAttribute('aria-selected', 'true');
  await expect(fixture).toHaveAttribute('data-nav-change-count', '1');

  await page.getByRole('tab', { name: 'Results' }).focus();
  await page.getByRole('tab', { name: 'Results' }).press('Space');
  await expect(page.getByRole('tab', { name: 'Results' })).toHaveAttribute('aria-selected', 'true');
  await expect(fixture).toHaveAttribute('data-nav-change-count', '2');
});

test('@a11y reduced motion disables loader translation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?scenario=loader&theme=light');
  await expect
    .poll(() => page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches))
    .toBe(true);
  const animationNames = await page
    .locator('.page-loader__dot, .page-loader__dots')
    .evaluateAll((elements) => elements.map((element) => window.getComputedStyle(element).animationName));
  expect(animationNames).toEqual(['none', 'none']);
});

test('@a11y scroll buttons are named native controls with minimum targets', async ({ page }) => {
  await page.goto('/?scenario=scroll&theme=light');
  const buttons = page.locator('.scroll-buttons__btn');
  await expect(buttons).toHaveCount(2);
  for (const button of await buttons.all()) {
    await expect(button).toHaveAttribute('type', 'button');
    await expect(button).toHaveAccessibleName(/.+/);
    const box = await button.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
  }
});

for (const theme of ['light', 'dark']) {
  test(`@a11y scroll buttons expose a visible ${theme} focus indicator`, async ({ page }) => {
    await page.goto(`/?scenario=scroll&theme=${theme}`);
    const button = page.getByRole('button', { name: 'Scroll to top' });
    await button.focus();
    const focusStyle = await button.evaluate((element) => {
      const parseRgb = (value) =>
        value
          .match(/[\d.]+/g)
          ?.slice(0, 3)
          .map(Number) ?? [];
      const luminance = (rgb) => {
        const channels = rgb.map((value) => {
          const normalized = value / 255;
          return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
      };
      const style = window.getComputedStyle(element);
      const outline = luminance(parseRgb(style.outlineColor));
      const background = luminance(parseRgb(style.backgroundColor));
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
        boxShadow: style.boxShadow,
        contrast: (Math.max(outline, background) + 0.05) / (Math.min(outline, background) + 0.05),
      };
    });
    expect(focusStyle.outlineStyle).not.toBe('none');
    expect(focusStyle.outlineWidth).toBeGreaterThanOrEqual(2);
    expect(focusStyle.boxShadow).not.toBe('none');
    expect(focusStyle.contrast).toBeGreaterThanOrEqual(3);
  });
}

test('@a11y active read-only tir results include names and non-color cues', async ({ page }) => {
  await page.goto('/?scenario=tir&theme=light');
  const results = page.locator('.visual-circles .tir-score-circle--active');
  await expect(results).toHaveCount(4);
  for (const result of await results.all()) {
    await expect(result).toHaveAccessibleName(/.+/);
    const hasNonColorCue = await result.evaluate(
      (element) => element.children.length > 0 || (element.textContent?.trim().length ?? 0) > 0,
    );
    expect(hasNonColorCue).toBe(true);
  }
});

test('@a11y timer uses a passive root and named native controls', async ({ page }) => {
  await page.goto('/?scenario=timer&theme=light');
  await expect(page.locator('.round-timer')).not.toHaveAttribute('role', 'button');
  const buttons = page.locator('.round-timer button');
  expect(await buttons.count()).toBeGreaterThan(0);
  for (const button of await buttons.all()) {
    await expect(button).toHaveAttribute('type', 'button');
    await expect(button).toHaveAccessibleName(/.+/);
  }
});

test('@a11y PublicPageShell selectors do not leak to an unrelated container', async ({ page }) => {
  await page.goto('/?scenario=leakage&theme=light');
  const styles = await page.evaluate(() => {
    const read = (testId) => {
      const element = document.querySelector(`[data-testid="${testId}"]`);
      const style = window.getComputedStyle(element);
      return { maxWidth: style.maxWidth, paddingBottom: style.paddingBottom, position: style.position };
    };
    return { shell: read('shell-container'), unrelated: read('unrelated-container') };
  });
  expect(styles.shell.maxWidth).toBe('800px');
  expect(styles.unrelated.maxWidth).not.toBe('800px');
  expect(styles.unrelated.paddingBottom).not.toBe(styles.shell.paddingBottom);
});
