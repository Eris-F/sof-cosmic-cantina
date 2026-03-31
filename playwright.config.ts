import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  retries: 0,
  workers: 12,
  reporter: [
    ['html', { open: 'on-failure' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5199',
    headless: true,
    hasTouch: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite --port 5199 --strictPort',
    port: 5199,
    reuseExistingServer: true,
    timeout: 15_000,
  },
  projects: [
    {
      name: 'iphone-14',
      use: { browserName: 'chromium', viewport: { width: 390, height: 844 } },
    },
    {
      name: 'iphone-se',
      use: { browserName: 'chromium', viewport: { width: 375, height: 667 } },
    },
    {
      name: 'pixel-7',
      use: { browserName: 'chromium', viewport: { width: 412, height: 915 } },
    },
    {
      name: 'ipad-portrait',
      use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'galaxy-fold',
      use: { browserName: 'chromium', viewport: { width: 280, height: 653 } },
    },
  ],
});
