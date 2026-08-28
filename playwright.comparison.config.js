const path = require('path');
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/migration',
  testMatch: 'comparison-report.spec.js',
  fullyParallel: true,
  timeout: 240000,
  expect: { timeout: 10000 },
  forbidOnly: true,
  retries: 0,
  workers: Number(process.env.COMPARISON_WORKERS || process.env.MIGRATION_WORKERS || 2),
  outputDir: 'test-results/comparison',
  reporter: [
    [path.join(__dirname, 'tests/migration/comparison-reporter.js')],
    ['line'],
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
