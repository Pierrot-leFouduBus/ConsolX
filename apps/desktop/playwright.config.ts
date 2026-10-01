// Playwright configuration: end-to-end tests that drive the real ConsolX app (e2e/).
// Run them with `npm run test:e2e`, which builds the app first.
import { defineConfig } from '@playwright/test'

const onCi = Boolean(process.env['CI'])

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  // One test at a time: each one starts its own ConsolX window and shells.
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  // On GitHub, a failed test runs once more: shells start slower on CI machines.
  retries: onCi ? 1 : 0,
  reporter: onCi ? [['list'], ['github']] : 'list',
  outputDir: 'test-results'
})
