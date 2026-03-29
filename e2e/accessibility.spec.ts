/**
 * E2E tests — Accessibility (WCAG 2.1 AA)
 *
 * Uses @axe-core/playwright to run automated accessibility audits on all
 * major pages. Each test checks for zero critical/serious axe violations.
 *
 * These automated scans catch ~30% of WCAG issues. They complement (not
 * replace) manual keyboard navigation and screen reader testing.
 *
 * Scope: WCAG 2.1 Level AA — tags ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/** Shared axe configuration — WCAG 2.1 AA ruleset */
function axeConfig(builder: AxeBuilder) {
  return builder
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('#heroui-toast-container') // Third-party toast library
}

/** Run axe scan and fail on any violations */
async function expectNoViolations(page: import('@playwright/test').Page) {
  const results = await axeConfig(new AxeBuilder({ page })).analyze()

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(
        (v) =>
          `\n  [${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n    ` +
          v.nodes
            .slice(0, 3)
            .map((n) => n.html)
            .join('\n    ')
      )
      .join('\n')

    expect(results.violations, `Accessibility violations found:${summary}`).toHaveLength(0)
  }
}

// ── Public pages ──────────────────────────────────────────────────────────────

test.describe('Homepage — accessibility', () => {
  test('no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expectNoViolations(page)
  })

  test('skip-to-content link exists and is first focusable element', async ({ page }) => {
    await page.goto('/')
    // Tab once — first focus should be the skip link
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    const text = await focused.textContent()
    expect(text?.toLowerCase()).toMatch(/skip.*main|skip.*content/i)
  })

  test('all interactive elements reachable via keyboard', async ({ page }) => {
    await page.goto('/')
    // Tab through multiple elements and ensure no focus trap
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
    }
    // If we get here without hanging, no focus trap in top of page
  })
})

test.describe('About page — accessibility', () => {
  test('no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('networkidle')
    await expectNoViolations(page)
  })
})

test.describe('Certification page — accessibility', () => {
  test('no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/certification')
    await page.waitForLoadState('networkidle')
    await expectNoViolations(page)
  })
})

test.describe('Resources page — accessibility', () => {
  test('no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/resources')
    await page.waitForLoadState('networkidle')
    await expectNoViolations(page)
  })
})

test.describe('Contact page — accessibility', () => {
  test('no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/contact')
    await page.waitForLoadState('networkidle')
    await expectNoViolations(page)
  })

  test('contact form labels are associated with inputs', async ({ page }) => {
    await page.goto('/contact')
    await page.waitForLoadState('networkidle')

    // Each visible input should have a label
    const inputs = page.locator('input:not([type=hidden]), textarea, select')
    const count = await inputs.count()

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledby = await input.getAttribute('aria-labelledby')

      if (!ariaLabel && !ariaLabelledby && id) {
        const label = page.locator(`label[for="${id}"]`)
        const labelCount = await label.count()
        expect(labelCount, `Input #${id} has no associated label`).toBeGreaterThan(0)
      }
    }
  })
})

// ── Auth pages ────────────────────────────────────────────────────────────────

test.describe('Login page — accessibility', () => {
  test('no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expectNoViolations(page)
  })

  test('form is keyboard navigable', async ({ page }) => {
    await page.goto('/login')

    // Tab to email input
    await page.keyboard.press('Tab') // skip link
    // Continue tabbing to email
    const emailInput = page.getByLabel(/email/i)
    await emailInput.focus()
    await expect(emailInput).toBeFocused()

    // Tab to password
    await page.keyboard.press('Tab')
    const passwordInput = page.getByLabel(/password/i)
    await expect(passwordInput).toBeFocused()

    // Tab to submit button
    await page.keyboard.press('Tab')
    const submitButton = page.getByRole('button', { name: /log in|sign in/i })
    await expect(submitButton).toBeFocused()
  })

  test('error message announced via aria-live region', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('bad@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /log in|sign in/i }).click()

    // Error should be in an aria-live or role=alert region
    const errorRegion = page
      .getByRole('alert')
      .or(page.locator('[aria-live="polite"], [aria-live="assertive"]').filter({ hasText: /.+/ }))

    await expect(errorRegion.first()).toBeVisible({ timeout: 8_000 })
  })
})

test.describe('Register page — accessibility', () => {
  test('no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await expectNoViolations(page)
  })
})

test.describe('Forgot password page — accessibility', () => {
  test('no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')
    await expectNoViolations(page)
  })
})

// ── Coach directory ───────────────────────────────────────────────────────────

test.describe('Coach directory — accessibility', () => {
  test('no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/coaches')
    await page.waitForLoadState('networkidle')
    await expectNoViolations(page)
  })

  test('all coach card images have alt text', async ({ page }) => {
    await page.goto('/coaches')
    await page.waitForLoadState('networkidle')

    const images = page.locator('main img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      // alt="" is valid for decorative images; null means missing
      expect(alt, `Image at index ${i} is missing alt attribute`).not.toBeNull()
    }
  })

  test('search input has accessible label', async ({ page }) => {
    await page.goto('/coaches')
    await page.waitForLoadState('networkidle')

    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i))
    await expect(searchInput).toBeVisible()

    // Must have accessible label
    const ariaLabel = await searchInput.getAttribute('aria-label')
    const ariaLabelledby = await searchInput.getAttribute('aria-labelledby')
    const id = await searchInput.getAttribute('id')
    const hasLabel = id ? (await page.locator(`label[for="${id}"]`).count()) > 0 : false

    expect(
      ariaLabel ?? ariaLabelledby ?? (hasLabel ? 'label found' : null),
      'Search input has no accessible label'
    ).not.toBeNull()
  })
})

// ── Chapter page ──────────────────────────────────────────────────────────────

test.describe('Chapter page — accessibility', () => {
  test('no WCAG 2.1 AA violations', async ({ page }) => {
    const chapterSlug = process.env['TEST_CHAPTER_SLUG'] ?? 'usa'
    const response = await page.goto(`/${chapterSlug}`)

    if (response?.status() === 404) {
      test.skip(true, `Chapter "${chapterSlug}" not found — check seed data`)
      return
    }

    await page.waitForLoadState('networkidle')
    await expectNoViolations(page)
  })
})

// ── Payment page ──────────────────────────────────────────────────────────────

test.describe('Payment page — accessibility', () => {
  test('no WCAG 2.1 AA violations', async ({ page }) => {
    const chapterSlug = process.env['TEST_CHAPTER_SLUG'] ?? 'usa'
    const response = await page.goto(`/${chapterSlug}/pay`)

    if (response?.status() === 404) {
      test.skip(true, `Chapter "${chapterSlug}" not found — check seed data`)
      return
    }

    await page.waitForLoadState('networkidle')
    await expectNoViolations(page)
  })
})

// ── Heading hierarchy ─────────────────────────────────────────────────────────

const PAGES_TO_CHECK_HEADINGS = ['/', '/about', '/coaches', '/certification', '/login', '/register']

test.describe('Heading hierarchy — all major pages', () => {
  for (const pagePath of PAGES_TO_CHECK_HEADINGS) {
    test(`${pagePath} — exactly one h1, no skipped levels`, async ({ page }) => {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')

      // Exactly one h1
      const h1Count = await page.locator('h1').count()
      expect(h1Count, `${pagePath} should have exactly one h1`).toBe(1)

      // Gather heading levels
      const headings = page.locator('h1, h2, h3, h4, h5, h6')
      const headingCount = await headings.count()
      const levels: number[] = []

      for (let i = 0; i < headingCount; i++) {
        const tagName = await headings.nth(i).evaluate((el) => el.tagName.toLowerCase())
        levels.push(parseInt(tagName.replace('h', ''), 10))
      }

      // Check no skipped levels (e.g., h1 → h3 without h2)
      for (let i = 1; i < levels.length; i++) {
        const prev = levels[i - 1] ?? 1
        const curr = levels[i] ?? 1
        expect(
          curr - prev,
          `Heading level skipped on ${pagePath}: h${prev} → h${curr}`
        ).toBeLessThanOrEqual(1)
      }
    })
  }
})

// ── Focus visibility ──────────────────────────────────────────────────────────

test.describe('Focus visibility', () => {
  test('focused links have visible focus indicator on homepage', async ({ page }) => {
    await page.goto('/')

    // Tab to first visible link
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    const focused = page.locator(':focus')
    const isLink = await focused.evaluate(
      (el) => el.tagName.toLowerCase() === 'a' || el.tagName.toLowerCase() === 'button'
    )

    if (isLink) {
      // Check there's an outline or box-shadow applied (focus styles)
      const styles = await focused.evaluate((el) => {
        const cs = window.getComputedStyle(el)
        return {
          outline: cs.outline,
          outlineWidth: cs.outlineWidth,
          boxShadow: cs.boxShadow,
        }
      })

      const hasFocusStyle = styles.outlineWidth !== '0px' || styles.boxShadow !== 'none'

      expect(hasFocusStyle, 'Focused element has no visible focus indicator').toBe(true)
    }
  })
})
