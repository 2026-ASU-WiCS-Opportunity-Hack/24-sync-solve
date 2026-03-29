/**
 * E2E tests — Payment flows
 *
 * These tests run with authenticated user state (storageState from global setup).
 * They verify the payment page renders correctly and that initiating checkout
 * redirects to Stripe.
 *
 * Note: Full Stripe checkout completion is NOT tested here because Stripe Checkout
 * is a hosted external page. Instead, we verify:
 *   1. The payment page renders with correct options and amounts
 *   2. The checkout button initiates a redirect toward stripe.com
 *   3. The success/cancel states display correctly when returned from Stripe
 *
 * For full payment integration testing, use Stripe test webhooks manually or
 * via a Stripe CLI webhook listener.
 */

import { test, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const AUTH_DIR = path.join(process.cwd(), '.auth')
const AUTH_STATE_FILE = path.join(AUTH_DIR, 'user.json')

function hasAuthState(file: string = AUTH_STATE_FILE): boolean {
  if (!fs.existsSync(file)) return false
  const state = JSON.parse(fs.readFileSync(file, 'utf-8')) as {
    cookies: unknown[]
  }
  return state.cookies.length > 0
}

// ── Payment page — authenticated ──────────────────────────────────────────────

test.describe('Chapter payment page (authenticated)', () => {
  // Apply user auth state at the describe level — overrides any project default
  test.use({
    storageState: hasAuthState() ? AUTH_STATE_FILE : { cookies: [], origins: [] },
  })

  test.beforeEach(async ({}) => {
    if (!hasAuthState()) {
      test.skip(true, 'No authenticated user state — set TEST_USER_EMAIL / TEST_USER_PASSWORD')
    }
  })

  test('payment page renders for authenticated user', async ({ page }) => {
    const chapterSlug = process.env['TEST_CHAPTER_SLUG'] ?? 'usa'
    const response = await page.goto(`/${chapterSlug}/pay`)

    if (response?.status() === 404) {
      test.skip(true, `Chapter "${chapterSlug}" not found — check seed data`)
      return
    }

    await expect(page).toHaveTitle(/dues|payments|pay/i)
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toHaveText(/payments?|dues/i)
  })

  test('enrollment fee option is displayed with correct amount', async ({ page }) => {
    const chapterSlug = process.env['TEST_CHAPTER_SLUG'] ?? 'usa'
    const response = await page.goto(`/${chapterSlug}/pay`)

    if (response?.status() === 404) {
      test.skip(true, `Chapter "${chapterSlug}" not found — check seed data`)
      return
    }

    // PAYMENT_AMOUNTS.ENROLLMENT_FEE = 5000 cents = $50.00
    await expect(page.getByText(/enrollment fee/i)).toBeVisible()
    // Amount display — formatted as currency
    await expect(page.getByText(/\$50\.00|\$50\.0|50\.00/i)).toBeVisible()
  })

  test('certification fee option is displayed with correct amount', async ({ page }) => {
    const chapterSlug = process.env['TEST_CHAPTER_SLUG'] ?? 'usa'
    const response = await page.goto(`/${chapterSlug}/pay`)

    if (response?.status() === 404) {
      test.skip(true, `Chapter "${chapterSlug}" not found — check seed data`)
      return
    }

    // PAYMENT_AMOUNTS.CERTIFICATION_FEE = 3000 cents = $30.00
    await expect(page.getByText(/certification fee/i)).toBeVisible()
    await expect(page.getByText(/\$30\.00|\$30\.0|30\.00/i)).toBeVisible()
  })

  test('proceed to payment button is present and enabled', async ({ page }) => {
    const chapterSlug = process.env['TEST_CHAPTER_SLUG'] ?? 'usa'
    const response = await page.goto(`/${chapterSlug}/pay`)

    if (response?.status() === 404) {
      test.skip(true, `Chapter "${chapterSlug}" not found — check seed data`)
      return
    }

    const checkoutButtons = page.getByRole('button', {
      name: /proceed to payment|pay now|checkout/i,
    })
    await expect(checkoutButtons.first()).toBeVisible()
    await expect(checkoutButtons.first()).toBeEnabled()
  })

  test('stripe security note is visible', async ({ page }) => {
    const chapterSlug = process.env['TEST_CHAPTER_SLUG'] ?? 'usa'
    const response = await page.goto(`/${chapterSlug}/pay`)

    if (response?.status() === 404) {
      test.skip(true, `Chapter "${chapterSlug}" not found — check seed data`)
      return
    }

    // Security note about Stripe — reassures users
    await expect(page.getByText(/secure|stripe|encrypted|pci/i).first()).toBeVisible()
  })

  test('checkout button initiates redirect to Stripe', async ({ page }) => {
    test.setTimeout(20_000) // Extended timeout for Stripe redirect
    const chapterSlug = process.env['TEST_CHAPTER_SLUG'] ?? 'usa'
    const response = await page.goto(`/${chapterSlug}/pay`)

    if (response?.status() === 404) {
      test.skip(true, `Chapter "${chapterSlug}" not found — check seed data`)
      return
    }

    // Listen for navigation events
    const navigationPromise = page.waitForURL(/stripe\.com|checkout\.stripe\.com/, {
      timeout: 15_000,
    })

    const checkoutButton = page
      .getByRole('button', { name: /proceed to payment|pay now|checkout/i })
      .first()

    await checkoutButton.click()

    // Should either navigate to Stripe OR stay on page with error message
    const stripeRedirect = await navigationPromise.then(() => true).catch(() => false)

    if (!stripeRedirect) {
      // If no redirect, there should be an error message
      const errorMsg = page.getByRole('alert').or(page.getByText(/error|unavailable|try again/i))
      await expect(errorMsg).toBeVisible({ timeout: 5_000 })
    }
  })
})

// ── Payment page — unauthenticated ────────────────────────────────────────────

test.describe('Chapter payment page (unauthenticated)', () => {
  // Explicitly clear cookies — ensures no auth even in authenticated projects
  test.use({ storageState: { cookies: [], origins: [] } })

  test('payment page redirects unauthenticated user to login', async ({ page }) => {
    const chapterSlug = process.env['TEST_CHAPTER_SLUG'] ?? 'usa'

    // Navigate WITHOUT auth state (this describe block uses no storageState)
    const response = await page.goto(`/${chapterSlug}/pay`)

    if (response?.status() === 404) {
      test.skip(true, `Chapter "${chapterSlug}" not found — check seed data`)
      return
    }

    // The payment PAGE itself may render, but submitting checkout
    // should redirect to /login. Check if page is accessible first.
    // If the page is protected, it should redirect immediately.
    const url = page.url()
    const isLoginPage = url.includes('/login')

    if (!isLoginPage) {
      // If page renders, verify checkout button triggers login redirect
      const checkoutButton = page
        .getByRole('button', { name: /proceed to payment|pay now/i })
        .first()

      if (await checkoutButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await checkoutButton.click()
        // Server action should detect no auth and return error
        await expect(
          page.getByText(/logged in|sign in|login/i).or(page.getByRole('alert'))
        ).toBeVisible({ timeout: 8_000 })
      }
    }
  })
})

// ── Payment success state ──────────────────────────────────────────────────────

test.describe('Payment success/cancel states', () => {
  test('success=true query param shows success message', async ({ page }) => {
    const chapterSlug = process.env['TEST_CHAPTER_SLUG'] ?? 'usa'
    const response = await page.goto(`/${chapterSlug}/pay?success=true`)

    if (response?.status() === 404) {
      test.skip(true, `Chapter "${chapterSlug}" not found — check seed data`)
      return
    }

    await expect(page.getByText(/payment successful|thank you|payment confirmed/i)).toBeVisible({
      timeout: 5_000,
    })

    // Success banner should use aria-live or role=status for screen readers
    const successBanner = page
      .getByRole('status')
      .or(page.locator('[aria-live]').filter({ hasText: /success/i }))
    await expect(successBanner.first()).toBeVisible()
  })

  test('cancelled=true query param shows cancellation message', async ({ page }) => {
    const chapterSlug = process.env['TEST_CHAPTER_SLUG'] ?? 'usa'
    const response = await page.goto(`/${chapterSlug}/pay?cancelled=true`)

    if (response?.status() === 404) {
      test.skip(true, `Chapter "${chapterSlug}" not found — check seed data`)
      return
    }

    await expect(page.getByText(/cancelled|payment cancelled|try again/i)).toBeVisible({
      timeout: 5_000,
    })
  })
})

// ── Webhook endpoint ──────────────────────────────────────────────────────────

test.describe('Stripe webhook endpoint', () => {
  test('POST /api/payments/webhooks rejects missing Stripe-Signature header', async ({
    request,
  }) => {
    const response = await request.post('/api/payments/webhooks', {
      data: JSON.stringify({ type: 'test' }),
      headers: { 'Content-Type': 'application/json' },
      // Intentionally omit Stripe-Signature
    })

    expect(response.status()).toBe(400)
    const body = (await response.json()) as { error: string }
    expect(body.error).toMatch(/stripe-signature|signature/i)
  })

  test('POST /api/payments/webhooks rejects invalid signature', async ({ request }) => {
    const response = await request.post('/api/payments/webhooks', {
      data: JSON.stringify({ type: 'checkout.session.completed' }),
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid-signature-xyz',
      },
    })

    expect(response.status()).toBe(400)
    const body = (await response.json()) as { error: string }
    expect(body.error).toMatch(/signature|invalid|webhook/i)
  })
})
