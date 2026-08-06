import { defineConfig } from '@playwright/test';

const visualPort = process.env.VISUAL_PORT || '4174';
const baseURL = `http://127.0.0.1:${visualPort}`;

export default defineConfig({
  testDir: './e2e/visual',
  testMatch: '**/*.visual.js',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    browserName: 'chromium',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npx vite --config e2e/harness/vite.config.js --host 127.0.0.1 --port ${visualPort} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30000,
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
});
