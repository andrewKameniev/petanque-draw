import { defineConfig } from '@playwright/test';

const a11yPort = process.env.A11Y_PORT || '4175';
const baseURL = `http://127.0.0.1:${a11yPort}`;

export default defineConfig({
  testDir: './e2e/visual',
  testMatch: '**/*.a11y.js',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    browserName: 'chromium',
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npx vite --config e2e/harness/vite.config.js --host 127.0.0.1 --port ${a11yPort} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30000,
  },
});
