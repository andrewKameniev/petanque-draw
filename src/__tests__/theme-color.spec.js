// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const palette = readFileSync('src/assets/css/variables.css', 'utf8');
const lightSurface = palette.match(/--grey-0:\s*([^;]+);/)[1];
const darkSurface = palette.match(/\[data-theme='dark'\][\s\S]*?--color-surface:\s*([^;]+);/)[1];

describe('mobile browser theme color', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.removeItem('petanqueDrawTheme');
    document.documentElement.removeAttribute('data-theme');
    document.head.innerHTML = `
      <meta name="theme-color" content="${lightSurface}" />
      <style>
        :root { --color-surface: ${lightSurface}; }
        [data-theme='dark'] { --color-surface: ${darkSurface}; }
      </style>
    `;
  });

  it('uses the selected surface color on first load and after toggling', async () => {
    localStorage.setItem('petanqueDrawTheme', 'dark');
    const { useTheme } = await import('@/composables/useTheme');
    const { nextTick } = await import('vue');
    const { toggleTheme } = useTheme();
    const meta = document.querySelector('meta[name="theme-color"]');

    expect(meta.content).toBe(darkSurface);
    toggleTheme();
    await nextTick();
    expect(meta.content).toBe(lightSurface);
    expect(localStorage.getItem('petanqueDrawTheme')).toBe('light');
  });
});
