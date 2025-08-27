import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 1, // set once, top-level
  workers: 4, // optional: parallel workers
  
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['line'],
  ],
  
  
  use: {
    baseURL: 'https://www.bbc.co.uk',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 800 },
    locale: 'en-GB',
    timezoneId: 'Europe/London',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
