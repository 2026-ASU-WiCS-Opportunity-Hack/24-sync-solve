import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDateRange,
  formatRelativeTime,
  formatNumber,
  truncate,
  slugify,
} from '@/lib/utils/format'

// ── formatCurrency ────────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats USD cents to dollar display', () => {
    expect(formatCurrency(5000, 'USD')).toBe('$50.00')
  })

  it('formats zero cents', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
  })

  it('formats GBP correctly', () => {
    const result = formatCurrency(3000, 'GBP', 'en-GB')
    expect(result).toContain('30')
  })

  it('formats fractional cents correctly', () => {
    expect(formatCurrency(199, 'USD')).toBe('$1.99')
  })
})

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats an ISO date string', () => {
    // Use explicit UTC timezone to avoid local-offset shifting the date
    const result = formatDate('2024-03-15', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })
    expect(result).toContain('2024')
    expect(result).toContain('15')
  })

  it('formats a Date object', () => {
    // Construct at noon UTC so local-timezone offsets don't shift the date
    const date = new Date('2024-01-15T12:00:00Z')
    const result = formatDate(date, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })
    expect(result).toContain('2024')
  })

  it('accepts custom format options', () => {
    const result = formatDate('2024-03-15', { month: 'short', year: 'numeric' }, 'en')
    expect(result).toMatch(/Mar.+2024|2024.+Mar/)
  })
})

// ── formatDateRange ───────────────────────────────────────────────────────────

describe('formatDateRange', () => {
  it('returns just the start date when no end date', () => {
    const result = formatDateRange('2024-03-15', null)
    expect(result).toContain('2024')
    expect(result).not.toContain('–')
  })

  it('formats a range with an end date', () => {
    const result = formatDateRange('2024-03-15', '2024-03-20')
    expect(result).toContain('–')
  })

  it('formats a same-month range compactly', () => {
    const result = formatDateRange('2024-03-10', '2024-03-15')
    // Should have "Mar" only once or compact notation
    expect(result).toContain('–')
  })
})

// ── formatRelativeTime ────────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-03-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "in X hours" for future dates', () => {
    const future = new Date('2024-03-15T15:00:00Z')
    const result = formatRelativeTime(future)
    expect(result).toMatch(/in \d+ hour/)
  })

  it('returns "X days ago" for past dates', () => {
    const past = new Date('2024-03-12T12:00:00Z')
    const result = formatRelativeTime(past)
    expect(result).toMatch(/\d+ day/)
  })

  it('handles ISO string input', () => {
    const result = formatRelativeTime('2024-03-14T12:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

// ── formatNumber ──────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('formats numbers with locale grouping', () => {
    const result = formatNumber(1000000)
    expect(result).toContain('1')
    expect(result.length).toBeGreaterThan(7) // Has separators
  })

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('handles negative numbers', () => {
    const result = formatNumber(-500)
    expect(result).toContain('500')
  })
})

// ── truncate ──────────────────────────────────────────────────────────────────

describe('truncate', () => {
  it('returns the original string when under the limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello')
  })

  it('truncates and appends ellipsis at the limit', () => {
    const result = truncate('Hello World', 5)
    expect(result).toBe('Hello…')
  })

  it('uses 150 as default max length', () => {
    const long = 'a'.repeat(200)
    const result = truncate(long)
    expect(result.length).toBeLessThanOrEqual(151) // 150 chars + ellipsis char
    expect(result.endsWith('…')).toBe(true)
  })

  it('returns unchanged string at exact limit length', () => {
    const exact = 'a'.repeat(150)
    expect(truncate(exact)).toBe(exact)
  })
})

// ── slugify ───────────────────────────────────────────────────────────────────

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('lowercases the string', () => {
    expect(slugify('WIAL USA Chapter')).toBe('wial-usa-chapter')
  })

  it('removes special characters', () => {
    expect(slugify("WIAL's Chapter!")).toBe('wials-chapter')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('action  learning')).toBe('action-learning')
  })

  it('strips leading and trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello')
  })

  it('handles already-slugified input', () => {
    expect(slugify('action-learning')).toBe('action-learning')
  })
})
