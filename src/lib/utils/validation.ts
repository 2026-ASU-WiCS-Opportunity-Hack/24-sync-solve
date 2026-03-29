import { z } from 'zod'

/**
 * Shared Zod validation schemas.
 * Feature-specific schemas live in their feature/types.ts files.
 */

/** Valid chapter slug: lowercase letters, numbers, hyphens */
export const chapterSlugSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')

/** Email address */
export const emailSchema = z.string().email('Please enter a valid email address')

/** Password with minimum requirements */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')

/** Hex color code */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #CC0000)')

/** URL (optional — empty string treated as null) */
export const optionalUrlSchema = z
  .string()
  .url('Must be a valid URL')
  .or(z.literal(''))
  .optional()
  .transform((val) => (val === '' ? undefined : val))

/** ISO 4217 currency code */
export const currencyCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, 'Must be a valid ISO 4217 currency code (e.g., USD)')

/** ISO 3166-1 alpha-2 country code */
export const countryCodeSchema = z
  .string()
  .length(2)
  .regex(/^[A-Z]{2}$/, 'Must be a valid 2-letter country code')

/** UUID */
export const uuidSchema = z.string().uuid('Must be a valid UUID')

/** Positive integer amount in cents */
export const amountInCentsSchema = z
  .number()
  .int('Amount must be a whole number')
  .positive('Amount must be positive')

/** Pagination cursor */
export const paginationSchema = z.object({
  cursor: uuidSchema.optional(),
  limit: z.number().int().min(1).max(100).default(12),
})

/** Coach search/filter params */
export const coachSearchSchema = z.object({
  q: z.string().max(200).optional(),
  certification: z.enum(['CALC', 'PALC', 'SALC', 'MALC']).optional(),
  country: z.string().max(2).optional(),
  chapter: chapterSlugSchema.optional(),
  cursor: uuidSchema.optional(),
})

/** Content block update — validates required fields */
export const contentBlockUpdateSchema = z.object({
  content: z.record(z.string(), z.unknown()),
  is_visible: z.boolean().optional(),
})

/** Login form */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

/** Registration form */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: z.string().min(1, 'Full name is required').max(100),
})

/** Forgot password form */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

/** Reset password form */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm_password: passwordSchema,
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

/** Chapter create form — all fields required */
export const chapterCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: chapterSlugSchema,
  country_code: countryCodeSchema,
  timezone: z.string().min(1, 'Timezone is required').max(100),
  currency: currencyCodeSchema,
  accent_color: hexColorSchema,
  contact_email: emailSchema
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  website_url: optionalUrlSchema,
})

export type ChapterCreateInput = z.infer<typeof chapterCreateSchema>

/** Chapter update form — same fields plus id and active flag */
export const chapterUpdateSchema = chapterCreateSchema.extend({
  id: uuidSchema,
  is_active: z
    .string()
    .optional()
    .transform((v) => v === 'true')
    .pipe(z.boolean())
    .optional(),
})

export type ChapterUpdateInput = z.infer<typeof chapterUpdateSchema>

// ── Coach profile ─────────────────────────────────────────────────────────────

/** Coach profile self-service update (fields the coach can edit themselves) */
export const coachProfileUpdateSchema = z.object({
  bio: z.string().max(2000, 'Bio must be under 2000 characters').optional(),
  specializations: z
    .array(z.string().min(1).max(100))
    .max(20, 'Maximum 20 specializations')
    .optional(),
  languages: z
    .array(z.string().min(1).max(50))
    .min(1, 'At least one language is required')
    .max(10)
    .optional(),
  location_city: z
    .string()
    .max(100)
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  location_country: z
    .string()
    .max(100)
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  contact_email: emailSchema
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  linkedin_url: optionalUrlSchema,
  coaching_hours: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .pipe(z.number().int().min(0).max(99999).optional()),
})

export type CoachProfileUpdateInput = z.infer<typeof coachProfileUpdateSchema>

// ── RBAC schemas ──────────────────────────────────────────────────────────────

/** Credly badge URL */
export const credlyUrlSchema = z
  .string()
  .url('Must be a valid URL')
  .refine(
    (url) => url.startsWith('https://www.credly.com/badges/'),
    'Must be a valid Credly badge URL (https://www.credly.com/badges/...)'
  )

/** Coach self-application form */
export const coachApplicationSchema = z.object({
  chapter_id: uuidSchema,
  credly_url: credlyUrlSchema,
  message: z
    .string()
    .max(1000, 'Message must be under 1000 characters')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
})

export type CoachApplicationInput = z.infer<typeof coachApplicationSchema>

/** Role assignment — assign a role to a user in a chapter */
export const roleAssignmentSchema = z.object({
  user_id: uuidSchema,
  chapter_id: uuidSchema,
  role: z.enum(['chapter_lead', 'content_editor', 'coach', 'user']),
})

export type RoleAssignmentInput = z.infer<typeof roleAssignmentSchema>

/** Account suspension */
export const suspensionSchema = z.object({
  user_id: uuidSchema,
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be under 500 characters'),
})

export type SuspensionInput = z.infer<typeof suspensionSchema>

/** Role-level suspension (chapter-scoped) */
export const roleSuspensionSchema = suspensionSchema.extend({
  chapter_id: uuidSchema,
  role: z.enum(['chapter_lead', 'content_editor', 'coach', 'user']),
})

export type RoleSuspensionInput = z.infer<typeof roleSuspensionSchema>

/** Role-level unsuspension — same as roleSuspensionSchema but without mandatory reason */
export const roleUnsuspensionSchema = z.object({
  user_id: uuidSchema,
  chapter_id: uuidSchema,
  role: z.enum(['chapter_lead', 'content_editor', 'coach', 'user']),
})

export type RoleUnsuspensionInput = z.infer<typeof roleUnsuspensionSchema>

/** Chapter request form */
export const chapterRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: chapterSlugSchema,
  country_code: countryCodeSchema,
  timezone: z.string().min(1, 'Timezone is required').max(100),
  currency: currencyCodeSchema,
  accent_color: hexColorSchema,
  contact_email: emailSchema
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  message: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
})

export type ChapterRequestInput = z.infer<typeof chapterRequestSchema>

/** Chapter request review (approve/reject) */
export const chapterRequestReviewSchema = z.object({
  request_id: uuidSchema,
  decision: z.enum(['approved', 'rejected']),
  review_notes: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
})

export type ChapterRequestReviewInput = z.infer<typeof chapterRequestReviewSchema>

// ── Events ────────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  'workshop',
  'webinar',
  'conference',
  'certification',
  'networking',
  'other',
] as const

/** Event creation form */
export const eventCreateSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z
      .string()
      .max(5000)
      .optional()
      .or(z.literal(''))
      .transform((v) => v || undefined),
    event_type: z.enum(EVENT_TYPES),
    start_date: z
      .string()
      .min(1, 'Start date is required')
      .refine((v) => !isNaN(Date.parse(v)), 'Must be a valid date/time'),
    end_date: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((v) => v || undefined)
      .refine((v) => !v || !isNaN(Date.parse(v)), 'Must be a valid date/time'),
    timezone: z.string().min(1, 'Timezone is required').max(100),
    location_name: z
      .string()
      .max(200)
      .optional()
      .or(z.literal(''))
      .transform((v) => v || undefined),
    is_virtual: z
      .string()
      .optional()
      .transform((v) => v === 'true')
      .pipe(z.boolean()),
    virtual_link: optionalUrlSchema,
    max_attendees: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((v) => (v ? parseInt(v, 10) : undefined))
      .pipe(z.number().int().positive().optional()),
    /** Ticket price in USD (displayed value). Stored as cents. Blank = free. */
    ticket_price_usd: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((v) => (v ? parseFloat(v) : undefined))
      .pipe(z.number().min(0.5, 'Price must be at least $0.50').optional()),
    registration_url: optionalUrlSchema,
    image_url: optionalUrlSchema,
    is_published: z
      .string()
      .optional()
      .transform((v) => v === 'true')
      .pipe(z.boolean()),
  })
  .refine(
    (data) => {
      if (!data.end_date) return true
      return new Date(data.start_date) <= new Date(data.end_date)
    },
    { message: 'End date must be on or after start date', path: ['end_date'] }
  )

/** Event registration (RSVP or paid) */
export const eventRegistrationSchema = z.object({
  event_id: uuidSchema,
  guest_name: z
    .string()
    .min(1, 'Name is required')
    .max(100)
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  guest_email: emailSchema
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
})

export type EventCreateInput = z.infer<typeof eventCreateSchema>

/** Event update form (all fields optional except id) */
export const eventUpdateSchema = eventCreateSchema.extend({
  id: uuidSchema,
})

export type EventUpdateInput = z.infer<typeof eventUpdateSchema>

/** Event search/filter params */
export const eventFilterSchema = z.object({
  type: z.enum(EVENT_TYPES).optional(),
  upcoming: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
})
