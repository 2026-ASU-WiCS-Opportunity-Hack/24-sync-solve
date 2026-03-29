/**
 * Playwright global setup — saves authenticated browser state for each test role.
 *
 * Runs ONCE before the test suite. Creates three auth state files:
 *   .auth/user.json          — authenticated coach (regular user)
 *   .auth/chapter-lead.json  — authenticated chapter lead
 *   .auth/admin.json         — authenticated super admin
 *
 * Setup reads credentials from environment variables:
 *   TEST_USER_EMAIL / TEST_USER_PASSWORD
 *   TEST_CHAPTER_LEAD_EMAIL / TEST_CHAPTER_LEAD_PASSWORD
 *   TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD
 *
 * For local development, create `.env.test.local` with these values.
 * These should correspond to seeded test users (see scripts/seed.ts).
 *
 * If credentials are missing the setup skips — tests requiring auth will
 * skip themselves via `test.skip()`.
 */

import { test as setup, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const AUTH_DIR = path.join(process.cwd(), '.auth')

export const AUTH_STATE = {
  user: path.join(AUTH_DIR, 'user.json'),
  chapterLead: path.join(AUTH_DIR, 'chapter-lead.json'),
  admin: path.join(AUTH_DIR, 'admin.json'),
} as const

async function loginAs(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
  storageStateFile: string
) {
  await page.goto('/login')

  const emailInput = page.getByLabel(/email/i)
  const passwordInput = page.getByLabel(/password/i)

  await emailInput.fill(email)
  await passwordInput.fill(password)

  await page.getByRole('button', { name: /log in|sign in/i }).click()

  // Wait for redirect away from /login — indicates successful auth
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })

  // Persist the browser storage (cookies + localStorage) for reuse in tests
  await page.context().storageState({ path: storageStateFile })
}

// ── Regular user (coach role) ─────────────────────────────────────────────────
setup('authenticate as user', async ({ page }) => {
  const email = process.env['TEST_USER_EMAIL']
  const password = process.env['TEST_USER_PASSWORD']

  if (!email || !password) {
    console.warn('⚠ TEST_USER_EMAIL / TEST_USER_PASSWORD not set — skipping user auth setup')
    // Write an empty state so dependent tests can detect missing auth
    fs.mkdirSync(AUTH_DIR, { recursive: true })
    fs.writeFileSync(AUTH_STATE.user, JSON.stringify({ cookies: [], origins: [] }))
    return
  }

  fs.mkdirSync(AUTH_DIR, { recursive: true })
  await loginAs(page, email, password, AUTH_STATE.user)
  console.log(`✓ Saved user auth state → ${AUTH_STATE.user}`)
})

// ── Chapter lead ──────────────────────────────────────────────────────────────
setup('authenticate as chapter lead', async ({ page }) => {
  const email = process.env['TEST_CHAPTER_LEAD_EMAIL']
  const password = process.env['TEST_CHAPTER_LEAD_PASSWORD']

  if (!email || !password) {
    console.warn(
      '⚠ TEST_CHAPTER_LEAD_EMAIL / TEST_CHAPTER_LEAD_PASSWORD not set — skipping chapter lead auth setup'
    )
    fs.mkdirSync(AUTH_DIR, { recursive: true })
    fs.writeFileSync(AUTH_STATE.chapterLead, JSON.stringify({ cookies: [], origins: [] }))
    return
  }

  fs.mkdirSync(AUTH_DIR, { recursive: true })
  await loginAs(page, email, password, AUTH_STATE.chapterLead)
  console.log(`✓ Saved chapter lead auth state → ${AUTH_STATE.chapterLead}`)
})

// ── Super admin ───────────────────────────────────────────────────────────────
setup('authenticate as admin', async ({ page }) => {
  const email = process.env['TEST_ADMIN_EMAIL']
  const password = process.env['TEST_ADMIN_PASSWORD']

  if (!email || !password) {
    console.warn('⚠ TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set — skipping admin auth setup')
    fs.mkdirSync(AUTH_DIR, { recursive: true })
    fs.writeFileSync(AUTH_STATE.admin, JSON.stringify({ cookies: [], origins: [] }))
    return
  }

  fs.mkdirSync(AUTH_DIR, { recursive: true })
  await loginAs(page, email, password, AUTH_STATE.admin)
  console.log(`✓ Saved admin auth state → ${AUTH_STATE.admin}`)
})
