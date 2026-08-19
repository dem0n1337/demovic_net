import { defineConfig, devices } from '@playwright/test'

// Both servers run the prebuilt Nitro output — run `npm run build` first.
const COMING_SOON_PORT = 3901
const MAINTENANCE_PORT = 3902

export default defineConfig({
  testDir: './tests',
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.03, animations: 'disabled', caret: 'hide' },
  },
  use: {
    baseURL: `http://127.0.0.1:${COMING_SOON_PORT}`,
    trace: 'on-first-retry',
    timezoneId: 'Europe/Bratislava',
    locale: 'en-GB',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'node .output/server/index.mjs',
      url: `http://127.0.0.1:${COMING_SOON_PORT}/`,
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: String(COMING_SOON_PORT),
        NUXT_NOTIFY_STORE_PATH: 'test-results/notify-store.jsonl',
      },
    },
    {
      command: 'node .output/server/index.mjs',
      // the maintenance page itself returns 503 by design — probe a static file instead
      url: `http://127.0.0.1:${MAINTENANCE_PORT}/robots.txt`,
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: String(MAINTENANCE_PORT),
        NUXT_PUBLIC_SITE_MODE: 'maintenance',
        NUXT_NOTIFY_STORE_PATH: 'test-results/notify-store-maintenance.jsonl',
      },
    },
  ],
})

export { COMING_SOON_PORT, MAINTENANCE_PORT }
