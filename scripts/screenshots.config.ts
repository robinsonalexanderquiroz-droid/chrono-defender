import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'capture-screenshots.spec.ts',
  timeout: 120_000,
  retries: 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://127.0.0.1:4173',
    // 960x540 viewport to match the game resolution exactly
    viewport: { width: 960, height: 540 },
    // No extra browser UI
    screenshot: 'off',
    video: 'off',
    trace: 'off',
  },

  projects: [
    {
      name: 'screenshots',
      use: {
        browserName: 'chromium',
        // Headless for clean captures
        headless: true,
      },
    },
  ],

  webServer: {
    command: 'npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173/chrono-defender/',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
