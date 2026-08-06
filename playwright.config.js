import { defineConfig } from '@playwright/test';
import { assertEmulatorEnvironment } from './e2e/emulator-environment.js';

assertEmulatorEnvironment();

const e2ePort = process.env.E2E_PORT || '5173';
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 3000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'html',
  globalSetup: './e2e/global-setup.js',
  use: {
    baseURL: e2eBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: false,
    timeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
