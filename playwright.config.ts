import { defineConfig } from '@playwright/test';

/**
 * Smoke léger pages publiques. Lancer après `npm run build && npm run preview`
 * puis : `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npm run test:e2e`
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
});
