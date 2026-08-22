const path = require('path');
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/migration',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  timeout: 240000,
  expect: { timeout: 10000 },
  forbidOnly: true,
  retries: process.env.CI ? 1 : 0,
  workers: Number(process.env.MIGRATION_WORKERS || 2),
  outputDir: 'test-results/playwright',
  reporter: [
    [path.join(__dirname, 'tests/migration/reporter.js')],
    ['html', { outputFolder: 'playwright-report/migration', open: 'never' }],
  ],
  use: {
    browserName: 'chromium',
    colorScheme: 'light',
    locale: 'en-US',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
});
