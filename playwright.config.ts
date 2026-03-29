import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  /* Run test files in parallel; within a file, tests run serially */
  fullyParallel: true,
  /* Fail the build on CI if test.only is accidentally left in */
  forbidOnly: !!process.env['CI'],
  /* Retry on CI only */
  retries: process.env['CI'] ? 2 : 0,
  /* Single worker on CI to avoid resource contention */
  workers: process.env['CI'] ? 1 : undefined,
  /* Reporters: HTML for local review, list for CI logs */
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : [['list'], ['html']],

  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000',
    /* Collect trace on first retry to aid debugging */
    trace: 'on-first-retry',
    /* Screenshot on failure only */
    screenshot: 'only-on-failure',
    /* Video on first retry */
    video: 'on-first-retry',
  },

  projects: [
    // ── Auth setup — runs once before all test projects ───────────────────────
    // Creates .auth/user.json, .auth/chapter-lead.json, .auth/admin.json
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Desktop Chrome — all spec files, depends on setup ────────────────────
    // Tests control their own storageState via test.use() per describe block
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: /global\.setup\.ts/,
    },

    // ── Firefox — navigation only (smoke test) ───────────────────────────────
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
      testMatch: /\/(navigation|auth)\.spec\.ts$/,
    },

    // ── Mobile Chrome — navigation only ─────────────────────────────────────
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
      testMatch: /\/navigation\.spec\.ts$/,
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
