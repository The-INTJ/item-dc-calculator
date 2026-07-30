import { defineConfig, devices } from '@playwright/test';

/**
 * Harmonizer-only E2E config. The feature never touches Firebase, so this
 * runs plain `next dev` (scripts/dev-next-only.mjs, port 3100) — no
 * emulators, no Java, no auth global-setup. Distinct port so a running
 * contest dev server on 3000 is never disturbed.
 */
const BASE_URL = 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: './e2e/harmonizer',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node scripts/dev-next-only.mjs',
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: true,
  },
});
