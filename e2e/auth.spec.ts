/**
 * E2E tests — Authentication flows
 *
 * Covers: login page render, invalid credentials, successful login,
 * registration page render, forgot-password page render, logout.
 *
 * Tests that require known credentials are skipped when env vars are absent,
 * so the suite stays green in CI environments without seed data.
 */

import { test, expect } from '@playwright/test'

// ── Login page ────────────────────────────────────────────────────────────────

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('renders login form with correct elements', async ({ page }) => {
    await expect(page).toHaveTitle(/log in/i)

    // Heading hierarchy — one h1
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()

    // Form fields
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /log in|sign in/i })).toBeVisible()

    // Link to register
    await expect(page.getByRole('link', { name: /register|create account|sign up/i })).toBeVisible()
  })

  test('shows skip-to-content link on focus', async ({ page }) => {
    // Skip link should be first focusable element — visible on focus
    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: /skip to main content/i })
    await expect(skipLink).toBeFocused()
  })

  test('shows validation error for empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /log in|sign in/i }).click()

    // Either HTML5 validation (fields required) or server-side error message
    const emailInput = page.getByLabel(/email/i)
    const isRequired = await emailInput.getAttribute('required')
    if (isRequired !== null) {
      // HTML5 required attribute present — browser validation fires
      await expect(emailInput).toBeFocused()
    } else {
      // Server action error message
      await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 })
    }
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword123')
    await page.getByRole('button', { name: /log in|sign in/i }).click()

    await expect(page.getByText(/invalid email or password|invalid credentials/i)).toBeVisible({
      timeout: 8_000,
    })
  })

  test('successful login redirects authenticated user', async ({ page }) => {
    const email = process.env['TEST_USER_EMAIL']
    const password = process.env['TEST_USER_PASSWORD']

    if (!email || !password) {
      test.skip(true, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set')
      return
    }

    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /log in|sign in/i }).click()

    // Should redirect away from /login to / or /dashboard
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('redirects already-authenticated user away from login', async ({ page }) => {
    const email = process.env['TEST_USER_EMAIL']
    const password = process.env['TEST_USER_PASSWORD']

    if (!email || !password) {
      test.skip(true, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set')
      return
    }

    // Log in first
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /log in|sign in/i }).click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })

    // Now navigate back to /login — should redirect away
    await page.goto('/login')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5_000 })
  })
})

// ── Register page ─────────────────────────────────────────────────────────────

test.describe('Register page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('renders registration form', async ({ page }) => {
    await expect(page).toHaveTitle(/create account|register|sign up/i)

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()

    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    // Password fields — may have multiple (confirm password)
    const passwordFields = page.getByLabel(/password/i)
    await expect(passwordFields.first()).toBeVisible()

    await expect(
      page.getByRole('button', { name: /create account|register|sign up/i })
    ).toBeVisible()
  })

  test('has link to login page', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /log in|sign in|already have/i })
    await expect(loginLink).toBeVisible()
    await loginLink.click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows validation errors for empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /create account|register|sign up/i }).click()

    // At minimum the first required field should be focused or an error shown
    const emailInput = page.getByLabel(/email/i)
    const isRequired = await emailInput.getAttribute('required')
    if (isRequired !== null) {
      await expect(emailInput).toBeFocused()
    } else {
      await expect(
        page
          .getByRole('alert')
          .or(page.locator('[aria-live]').filter({ hasText: /required|invalid/i }))
      ).toBeVisible({ timeout: 5_000 })
    }
  })

  test('shows error for mismatched passwords', async ({ page }) => {
    const passwordFields = await page.getByLabel(/^password$/i).all()
    const confirmFields = await page.getByLabel(/confirm password/i).all()

    if (confirmFields.length === 0) {
      test.skip(true, 'No confirm password field — password mismatch check N/A')
      return
    }

    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/email/i).fill(`test-${Date.now()}@example.com`)
    await passwordFields[0]?.fill('Password123!')
    await confirmFields[0]?.fill('DifferentPassword!')
    await page.getByRole('button', { name: /create account|register|sign up/i }).click()

    await expect(page.getByText(/passwords? do not match|passwords? must match/i)).toBeVisible({
      timeout: 5_000,
    })
  })
})

// ── Forgot password page ──────────────────────────────────────────────────────

test.describe('Forgot password page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password')
  })

  test('renders forgot password form', async ({ page }) => {
    await expect(page).toHaveTitle(/forgot password|reset password/i)

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()

    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send|reset|submit/i })).toBeVisible()
  })

  test('shows success message after valid email submission', async ({ page }) => {
    await page.getByLabel(/email/i).fill('user@example.com')
    await page.getByRole('button', { name: /send|reset|submit/i }).click()

    // Supabase always returns success to prevent email enumeration
    await expect(page.getByText(/check your email|email sent|reset link/i)).toBeVisible({
      timeout: 8_000,
    })
  })

  test('has link back to login', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /back to log in|back to login|sign in/i })
    await expect(backLink).toBeVisible()
    await backLink.click()
    await expect(page).toHaveURL(/\/login/)
  })
})

// ── Logout flow ───────────────────────────────────────────────────────────────

test.describe('Logout', () => {
  test('logout redirects to login page', async ({ page }) => {
    const email = process.env['TEST_USER_EMAIL']
    const password = process.env['TEST_USER_PASSWORD']

    if (!email || !password) {
      test.skip(true, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set')
      return
    }

    // Log in first
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /log in|sign in/i }).click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })

    // Find and click logout button/link
    const logoutButton = page
      .getByRole('button', { name: /log out|sign out/i })
      .or(page.getByRole('link', { name: /log out|sign out/i }))

    // Logout may be in a menu — try to open it first
    const menuTrigger = page.getByRole('button', { name: /account|menu|profile/i })
    if (await menuTrigger.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await menuTrigger.click()
    }

    await expect(logoutButton.first()).toBeVisible({ timeout: 5_000 })
    await logoutButton.first().click()

    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
  })
})

// ── Auth redirect protection ──────────────────────────────────────────────────

test.describe('Protected route redirects', () => {
  test('unauthenticated user is redirected from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })

  test('unauthenticated user is redirected from /admin to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })
})
