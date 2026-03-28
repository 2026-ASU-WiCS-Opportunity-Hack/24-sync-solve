/**
 * Formatting utilities using native Intl APIs.
 * All functions accept a locale parameter for future i18n support.
 * Amounts are stored in cents (integer) and formatted at render time.
 */

/**
 * Format a currency amount from cents to display string.
 * @param amountInCents - Amount in smallest currency unit (cents for USD)
 * @param currency - ISO 4217 currency code (e.g., 'USD', 'GBP', 'NGN')
 * @param locale - BCP 47 locale string
 */
export function formatCurrency(
  amountInCents: number,
  currency: string = 'USD',
  locale: string = 'en'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amountInCents / 100)
}

/**
 * Format a date for display.
 * @param date - Date object or ISO string
 * @param options - Intl.DateTimeFormatOptions
 * @param locale - BCP 47 locale string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  locale: string = 'en'
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, options).format(d)
}

/**
 * Format a date range (start and optional end).
 */
export function formatDateRange(
  startDate: Date | string,
  endDate: Date | string | null | undefined,
  locale: string = 'en'
): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const formatted = formatDate(start, { month: 'short', day: 'numeric', year: 'numeric' }, locale)

  if (!endDate) return formatted

  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()

  if (sameMonth) {
    return `${new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(start)}–${new Intl.DateTimeFormat(locale, { day: 'numeric', year: 'numeric' }).format(end)}`
  }

  if (sameYear) {
    return `${new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(start)}–${new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(end)}`
  }

  return `${formatted}–${formatDate(end, { month: 'short', day: 'numeric', year: 'numeric' }, locale)}`
}

/**
 * Format a relative time (e.g., "3 days ago", "in 2 weeks").
 */
export function formatRelativeTime(date: Date | string, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffSeconds = Math.round(diffMs / 1000)
  const diffMinutes = Math.round(diffSeconds / 60)
  const diffHours = Math.round(diffMinutes / 60)
  const diffDays = Math.round(diffHours / 24)
  const diffWeeks = Math.round(diffDays / 7)
  const diffMonths = Math.round(diffDays / 30)
  const diffYears = Math.round(diffDays / 365)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (Math.abs(diffSeconds) < 60) return rtf.format(diffSeconds, 'second')
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute')
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, 'day')
  if (Math.abs(diffWeeks) < 4) return rtf.format(diffWeeks, 'week')
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, 'month')
  return rtf.format(diffYears, 'year')
}

/**
 * Format a number with locale-aware grouping.
 */
export function formatNumber(value: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale).format(value)
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

/**
 * Convert a string to a URL-safe slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
