import { defineConfig } from '@playwright/test';

const e2ePort = Number(process.env.E2E_PORT || 5173);

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 3000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${e2ePort}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npm run dev -- --port ${e2ePort}`,
    url: `http://localhost:${e2ePort}`,
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
