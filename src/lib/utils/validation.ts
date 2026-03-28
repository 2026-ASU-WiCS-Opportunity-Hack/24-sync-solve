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
