import { describe, it, expect } from 'vitest'
import {
  chapterSlugSchema,
  emailSchema,
  passwordSchema,
  hexColorSchema,
  currencyCodeSchema,
  countryCodeSchema,
  uuidSchema,
  amountInCentsSchema,
  paginationSchema,
  coachSearchSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  chapterCreateSchema,
  eventFilterSchema,
} from '@/lib/utils/validation'

// ── chapterSlugSchema ─────────────────────────────────────────────────────────

describe('chapterSlugSchema', () => {
  it('accepts valid slugs', () => {
    expect(chapterSlugSchema.safeParse('usa').success).toBe(true)
    expect(chapterSlugSchema.safeParse('south-africa').success).toBe(true)
    expect(chapterSlugSchema.safeParse('chapter-123').success).toBe(true)
  })

  it('rejects slugs with uppercase letters', () => {
    expect(chapterSlugSchema.safeParse('USA').success).toBe(false)
  })

  it('rejects slugs with spaces', () => {
    expect(chapterSlugSchema.safeParse('south africa').success).toBe(false)
  })

  it('rejects slugs that are too short', () => {
    expect(chapterSlugSchema.safeParse('a').success).toBe(false)
  })

  it('rejects slugs that are too long', () => {
    expect(chapterSlugSchema.safeParse('a'.repeat(51)).success).toBe(false)
  })
})

// ── emailSchema ───────────────────────────────────────────────────────────────

describe('emailSchema', () => {
  it('accepts valid emails', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true)
    expect(emailSchema.safeParse('user+tag@sub.domain.org').success).toBe(true)
  })

  it('rejects malformed emails', () => {
    expect(emailSchema.safeParse('notanemail').success).toBe(false)
    expect(emailSchema.safeParse('@example.com').success).toBe(false)
    expect(emailSchema.safeParse('user@').success).toBe(false)
  })
})

// ── passwordSchema ────────────────────────────────────────────────────────────

describe('passwordSchema', () => {
  it('accepts passwords 8+ chars', () => {
    expect(passwordSchema.safeParse('securepw').success).toBe(true)
    expect(passwordSchema.safeParse('a'.repeat(128)).success).toBe(true)
  })

  it('rejects passwords under 8 chars', () => {
    expect(passwordSchema.safeParse('short').success).toBe(false)
  })

  it('rejects passwords over 128 chars', () => {
    expect(passwordSchema.safeParse('a'.repeat(129)).success).toBe(false)
  })
})

// ── hexColorSchema ────────────────────────────────────────────────────────────

describe('hexColorSchema', () => {
  it('accepts valid 6-digit hex colors', () => {
    expect(hexColorSchema.safeParse('#CC0000').success).toBe(true)
    expect(hexColorSchema.safeParse('#ffffff').success).toBe(true)
    expect(hexColorSchema.safeParse('#1A2B3C').success).toBe(true)
  })

  it('rejects colors without leading #', () => {
    expect(hexColorSchema.safeParse('CC0000').success).toBe(false)
  })

  it('rejects 3-digit hex shorthand', () => {
    expect(hexColorSchema.safeParse('#C00').success).toBe(false)
  })

  it('rejects non-hex characters', () => {
    expect(hexColorSchema.safeParse('#GGGGGG').success).toBe(false)
  })
})

// ── currencyCodeSchema ────────────────────────────────────────────────────────

describe('currencyCodeSchema', () => {
  it('accepts valid ISO 4217 codes', () => {
    expect(currencyCodeSchema.safeParse('USD').success).toBe(true)
    expect(currencyCodeSchema.safeParse('GBP').success).toBe(true)
    expect(currencyCodeSchema.safeParse('NGN').success).toBe(true)
  })

  it('rejects lowercase codes', () => {
    expect(currencyCodeSchema.safeParse('usd').success).toBe(false)
  })

  it('rejects codes that are not 3 characters', () => {
    expect(currencyCodeSchema.safeParse('US').success).toBe(false)
    expect(currencyCodeSchema.safeParse('USDD').success).toBe(false)
  })
})

// ── countryCodeSchema ─────────────────────────────────────────────────────────

describe('countryCodeSchema', () => {
  it('accepts valid ISO 3166-1 alpha-2 codes', () => {
    expect(countryCodeSchema.safeParse('US').success).toBe(true)
    expect(countryCodeSchema.safeParse('NG').success).toBe(true)
    expect(countryCodeSchema.safeParse('BR').success).toBe(true)
  })

  it('rejects codes that are not 2 characters', () => {
    expect(countryCodeSchema.safeParse('USA').success).toBe(false)
    expect(countryCodeSchema.safeParse('U').success).toBe(false)
  })

  it('rejects lowercase codes', () => {
    expect(countryCodeSchema.safeParse('us').success).toBe(false)
  })
})

// ── uuidSchema ────────────────────────────────────────────────────────────────

describe('uuidSchema', () => {
  it('accepts valid UUIDs', () => {
    expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
  })

  it('rejects non-UUIDs', () => {
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false)
    expect(uuidSchema.safeParse('').success).toBe(false)
  })
})

// ── amountInCentsSchema ───────────────────────────────────────────────────────

describe('amountInCentsSchema', () => {
  it('accepts positive integers', () => {
    expect(amountInCentsSchema.safeParse(5000).success).toBe(true)
    expect(amountInCentsSchema.safeParse(1).success).toBe(true)
  })

  it('rejects zero and negatives', () => {
    expect(amountInCentsSchema.safeParse(0).success).toBe(false)
    expect(amountInCentsSchema.safeParse(-100).success).toBe(false)
  })

  it('rejects non-integers', () => {
    expect(amountInCentsSchema.safeParse(9.99).success).toBe(false)
  })
})

// ── paginationSchema ──────────────────────────────────────────────────────────

describe('paginationSchema', () => {
  it('uses default limit of 12', () => {
    const result = paginationSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(12)
  })

  it('accepts custom limit within range', () => {
    const result = paginationSchema.safeParse({ limit: 50 })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(50)
  })

  it('rejects limit above 100', () => {
    expect(paginationSchema.safeParse({ limit: 101 }).success).toBe(false)
  })

  it('accepts valid cursor UUID', () => {
    const result = paginationSchema.safeParse({ cursor: '550e8400-e29b-41d4-a716-446655440000' })
    expect(result.success).toBe(true)
  })
})

// ── coachSearchSchema ─────────────────────────────────────────────────────────

describe('coachSearchSchema', () => {
  it('accepts empty filter object', () => {
    expect(coachSearchSchema.safeParse({}).success).toBe(true)
  })

  it('accepts valid certification level', () => {
    const result = coachSearchSchema.safeParse({ certification: 'MALC' })
    expect(result.success).toBe(true)
  })

  it('rejects unknown certification level', () => {
    expect(coachSearchSchema.safeParse({ certification: 'UNKNOWN' }).success).toBe(false)
  })

  it('rejects query over 200 chars', () => {
    expect(coachSearchSchema.safeParse({ q: 'a'.repeat(201) }).success).toBe(false)
  })
})

// ── loginSchema ───────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'user@wial.org', password: 'secret123' }).success).toBe(
      true
    )
  })

  it('rejects missing email', () => {
    expect(loginSchema.safeParse({ password: 'secret123' }).success).toBe(false)
  })

  it('rejects missing password', () => {
    expect(loginSchema.safeParse({ email: 'user@wial.org', password: '' }).success).toBe(false)
  })
})

// ── registerSchema ────────────────────────────────────────────────────────────

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    expect(
      registerSchema.safeParse({
        email: 'user@wial.org',
        password: 'securepassword1',
        full_name: 'Jane Doe',
      }).success
    ).toBe(true)
  })

  it('rejects password under 8 chars', () => {
    expect(
      registerSchema.safeParse({
        email: 'user@wial.org',
        password: 'short',
        full_name: 'Jane Doe',
      }).success
    ).toBe(false)
  })

  it('rejects empty full name', () => {
    expect(
      registerSchema.safeParse({
        email: 'user@wial.org',
        password: 'securepassword1',
        full_name: '',
      }).success
    ).toBe(false)
  })
})

// ── resetPasswordSchema ───────────────────────────────────────────────────────

describe('resetPasswordSchema', () => {
  it('accepts matching passwords', () => {
    expect(
      resetPasswordSchema.safeParse({
        password: 'newpassword1',
        confirm_password: 'newpassword1',
      }).success
    ).toBe(true)
  })

  it('rejects non-matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpassword1',
      confirm_password: 'different',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      // Zod v4 uses .issues (not .errors)
      expect(result.error.issues[0]?.path).toContain('confirm_password')
    }
  })
})

// ── chapterCreateSchema ───────────────────────────────────────────────────────

describe('chapterCreateSchema', () => {
  const valid = {
    name: 'USA Chapter',
    slug: 'usa',
    country_code: 'US',
    timezone: 'America/New_York',
    currency: 'USD',
    accent_color: '#CC0000',
    contact_email: 'usa@wial.org',
  }

  it('accepts valid chapter data', () => {
    expect(chapterCreateSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects name under 2 chars', () => {
    expect(chapterCreateSchema.safeParse({ ...valid, name: 'X' }).success).toBe(false)
  })

  it('rejects invalid accent color', () => {
    expect(chapterCreateSchema.safeParse({ ...valid, accent_color: 'red' }).success).toBe(false)
  })

  it('rejects invalid currency code', () => {
    expect(chapterCreateSchema.safeParse({ ...valid, currency: 'us' }).success).toBe(false)
  })

  it('transforms empty contact_email to undefined', () => {
    const result = chapterCreateSchema.safeParse({ ...valid, contact_email: '' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.contact_email).toBeUndefined()
  })
})

// ── eventFilterSchema ─────────────────────────────────────────────────────────

describe('eventFilterSchema', () => {
  it('defaults upcoming to true when not "false"', () => {
    const result = eventFilterSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.upcoming).toBe(true)
  })

  it('sets upcoming to false when "false" string is passed', () => {
    const result = eventFilterSchema.safeParse({ upcoming: 'false' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.upcoming).toBe(false)
  })

  it('accepts valid event type', () => {
    expect(eventFilterSchema.safeParse({ type: 'webinar' }).success).toBe(true)
  })

  it('rejects unknown event type', () => {
    expect(eventFilterSchema.safeParse({ type: 'party' }).success).toBe(false)
  })
})
