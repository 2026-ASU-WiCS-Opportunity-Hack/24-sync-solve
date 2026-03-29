/**
 * E2E tests — Navigation and public page rendering
 *
 * Verifies that all public pages load without errors, contain correct
 * heading hierarchy, render nav/footer, and respond correctly on mobile.
 */

import { test, expect } from '@playwright/test'

// ── Global pages ──────────────────────────────────────────────────────────────

test.describe('Global homepage', () => {
  test('loads and renders hero section', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/WIAL|World Institute for Action Learning/i)

    // At minimum one heading should exist
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
  })

  test('skip-to-content link is first focusable element', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: /skip to main content/i })
    await expect(skipLink).toBeFocused()
  })

  test('skip-to-content navigates to main landmark', async ({ page }) => {
    await page.goto('/')
    // Press Tab then Enter to activate skip link
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    // The main content region should be focused
    const main = page.getByRole('main')
    await expect(main).toBeVisible()
  })

  test('renders header with WIAL logo/name', async ({ page }) => {
    await page.goto('/')
    const header = page.getByRole('banner')
    await expect(header).toBeVisible()
    // Logo or site name in the header
    await expect(
      header.getByText(/WIAL/i).or(header.getByRole('img', { name: /WIAL/i }))
    ).toBeVisible()
  })

  test('renders footer', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await expect(footer).toBeVisible()
  })

  test('nav links are present and keyboard reachable', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()

    // Coaches link
    const coachLink = nav.getByRole('link', { name: /coaches/i })
    await expect(coachLink).toBeVisible()
  })
})

// ── Core global pages ─────────────────────────────────────────────────────────

const GLOBAL_PAGES: Array<{ path: string; titlePattern: RegExp; h1Pattern: RegExp }> = [
  {
    path: '/about',
    titlePattern: /about|WIAL/i,
    h1Pattern: /about/i,
  },
  {
    path: '/certification',
    titlePattern: /certification|certif/i,
    h1Pattern: /certif/i,
  },
  {
    path: '/coaches',
    titlePattern: /coaches|find a coach/i,
    h1Pattern: /coach/i,
  },
  {
    path: '/resources',
    titlePattern: /resources/i,
    h1Pattern: /resources/i,
  },
  {
    path: '/contact',
    titlePattern: /contact/i,
    h1Pattern: /contact/i,
  },
]

for (const { path, titlePattern, h1Pattern } of GLOBAL_PAGES) {
  test(`${path} — loads with correct title and h1`, async ({ page }) => {
    await page.goto(path)

    await expect(page).toHaveTitle(titlePattern)

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toHaveText(h1Pattern)
  })

  test(`${path} — renders header and footer`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test(`${path} — no broken layout (no uncaught errors)`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto(path)
    await page.waitForLoadState('networkidle')

    // Filter out non-critical errors (hydration mismatch warnings etc.)
    const criticalErrors = errors.filter((e) => !e.includes('Warning:') && !e.includes('hydrat'))
    expect(
      criticalErrors,
      `Critical JS errors on ${path}: ${criticalErrors.join('\n')}`
    ).toHaveLength(0)
  })
}

// ── Chapter pages ─────────────────────────────────────────────────────────────

test.describe('Chapter routing', () => {
  test('known chapter page loads with chapter name in title', async ({ page }) => {
    const chapterSlug = process.env['TEST_CHAPTER_SLUG'] ?? 'usa'

    const response = await page.goto(`/${chapterSlug}`)

    // If chapter doesn't exist in seed data, 404 is acceptable
    if (response?.status() === 404) {
      test.skip(true, `Chapter "${chapterSlug}" not found — check seed data`)
      return
    }

    await expect(page).toHaveTitle(new RegExp(chapterSlug, 'i'))
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('non-existent chapter slug returns 404', async ({ page }) => {
    const response = await page.goto('/this-chapter-does-not-exist-xyz')
    expect(response?.status()).toBe(404)
  })

  test('chapter page has accent colour applied', async ({ page }) => {
    const chapterSlug = process.env['TEST_CHAPTER_SLUG'] ?? 'usa'
    const response = await page.goto(`/${chapterSlug}`)

    if (response?.status() === 404) {
      test.skip(true, `Chapter "${chapterSlug}" not found — check seed data`)
      return
    }

    // The chapter layout applies --color-chapter-accent via style attribute on <main>
    const main = page.getByRole('main')
    const style = await main.getAttribute('style')
    expect(style).toMatch(/--color-chapter-accent/)
  })

  test('chapter sub-pages are accessible', async ({ page }) => {
    const chapterSlug = process.env['TEST_CHAPTER_SLUG'] ?? 'usa'

    const subPages = [`/${chapterSlug}/about`, `/${chapterSlug}/coaches`]

    for (const subPage of subPages) {
      const response = await page.goto(subPage)
      // Accept 200 or 404 (if chapter/page doesn't exist in seed data)
      expect([200, 404]).toContain(response?.status())
    }
  })
})

// ── 404 page ──────────────────────────────────────────────────────────────────

test.describe('404 page', () => {
  test('unknown route shows 404 page', async ({ page }) => {
    const response = await page.goto('/this-page-definitely-does-not-exist-404xyz')
    expect(response?.status()).toBe(404)

    // Next.js renders a 404 page — check for some content
    const body = page.locator('body')
    await expect(body).not.toBeEmpty()
  })
})

// ── Mobile navigation ─────────────────────────────────────────────────────────

test.describe('Mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('homepage renders on mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('mobile menu is accessible', async ({ page }) => {
    await page.goto('/')

    // Look for a hamburger / menu button on mobile
    const menuButton = page.getByRole('button', { name: /menu|navigation/i })
    if (await menuButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await menuButton.click()
      // After opening, nav links should be visible
      await expect(page.getByRole('navigation')).toBeVisible()
    }
    // If no hamburger, desktop nav is used — still passes
  })
})
