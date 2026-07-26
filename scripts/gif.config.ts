import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'capture-gif.spec.ts',
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 960, height: 540 },
    // Record video for GIF conversion
    video: {
      mode: 'on',
      size: { width: 960, height: 540 },
    },
    screenshot: 'off',
    trace: 'off',
  },

  projects: [
    {
      name: 'gif-capture',
      use: {
        browserName: 'chromium',
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
