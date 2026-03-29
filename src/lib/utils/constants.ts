/**
 * Application-wide constants.
 * Import specific constants — do not import * from this file.
 */

/** WIAL brand colors (mirrors CSS variables in globals.css) */
export const WIAL_BRAND = {
  NAVY: '#003366',
  NAVY_LIGHT: '#004488',
  NAVY_DARK: '#002244',
  RED: '#CC0000',
  RED_LIGHT: '#EE1111',
  RED_DARK: '#AA0000',
  WHITE: '#FFFFFF',
} as const

/** User role hierarchy (lower index = less privileged).
 *  'public' kept for DB enum compatibility but never assigned to real users. */
export const ROLE_HIERARCHY = [
  'user',
  'coach',
  'content_editor',
  'chapter_lead',
  'super_admin',
] as const

/** Human-readable role labels (UI label: chapter_lead → "Chapter Admin") */
export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  chapter_lead: 'Chapter Admin',
  content_editor: 'Content Editor',
  coach: 'Coach',
  user: 'User',
} as const

/** Tailwind badge color classes per role */
export const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-700',
  chapter_lead: 'bg-purple-100 text-purple-700',
  content_editor: 'bg-blue-100 text-blue-700',
  coach: 'bg-green-100 text-green-700',
  user: 'bg-gray-100 text-gray-600',
} as const

/** Certification level display names */
export const CERTIFICATION_LABELS = {
  CALC: 'Certified Action Learning Coach',
  PALC: 'Professional Action Learning Coach',
  SALC: 'Senior Action Learning Coach',
  MALC: 'Master Action Learning Coach',
} as const

/** Certification level order (from beginner to master) */
export const CERTIFICATION_ORDER = ['CALC', 'PALC', 'SALC', 'MALC'] as const

/** Coach directory pagination */
export const COACH_PAGE_SIZE = 12

/** Content block sort order increment */
export const SORT_ORDER_INCREMENT = 10

/** File upload limits (bytes) */
export const UPLOAD_LIMITS = {
  AVATAR: 2 * 1024 * 1024, // 2MB
  COACH_PHOTO: 2 * 1024 * 1024, // 2MB
  CHAPTER_ASSET: 5 * 1024 * 1024, // 5MB
  CONTENT_IMAGE: 2 * 1024 * 1024, // 2MB
} as const

/** Allowed MIME types for uploads */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const

/** Default chapter accent color */
export const DEFAULT_ACCENT_COLOR = '#CC0000'

/** Common IANA timezone identifiers used across chapter and event forms */
export const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
] as const

/** Site URL — server-side only */
export const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000'

/** Navigation links for global site */
export const GLOBAL_NAV_LINKS = [
  { href: '/about', labelKey: 'nav.about' },
  { href: '/coaches', labelKey: 'nav.coaches' },
  { href: '/resources', labelKey: 'nav.resources' },
  { href: '/events', labelKey: 'nav.events' },
] as const

/** Navigation links for chapter sub-sites */
export const CHAPTER_NAV_LINKS = [
  { href: '/about', labelKey: 'nav.about' },
  { href: '/coaches', labelKey: 'nav.coaches' },
  { href: '/resources', labelKey: 'nav.resources' },
  { href: '/events', labelKey: 'nav.events' },
  { href: '/pay', labelKey: 'nav.pay' },
] as const
