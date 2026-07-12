import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e/specs',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /mobile-.*\.spec\.ts/,
    },
    {
      // Mobile project runs only mobile-* specs (412px wide — below MUI's
      // `sm`, so the vote modal goes fullscreen).
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testMatch: /mobile-.*\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'node scripts/dev.mjs',
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
