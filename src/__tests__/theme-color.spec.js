// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('mobile browser theme color', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.removeItem('petanqueDrawTheme');
    document.documentElement.removeAttribute('data-theme');
    document.head.innerHTML = `
      <meta name="theme-color" content="#ffffff" />
      <style>
        :root { --color-surface: #fff; }
        [data-theme='dark'] { --color-surface: #181a24; }
      </style>
    `;
  });

  it('uses the selected surface color on first load and after toggling', async () => {
    localStorage.setItem('petanqueDrawTheme', 'dark');
    const { useTheme } = await import('@/composables/useTheme');
    const { nextTick } = await import('vue');
    const { toggleTheme } = useTheme();
    const meta = document.querySelector('meta[name="theme-color"]');

    expect(meta.content).toBe('#181a24');
    toggleTheme();
    await nextTick();
    expect(meta.content).toBe('#fff');
    expect(localStorage.getItem('petanqueDrawTheme')).toBe('light');
  });
});
