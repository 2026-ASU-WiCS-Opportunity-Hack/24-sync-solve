import { describe, it, expect } from 'vitest'
import {
  heroBlockSchema,
  textBlockSchema,
  imageBlockSchema,
  ctaBlockSchema,
  statsBlockSchema,
  eventListBlockSchema,
  coachListBlockSchema,
  testimonialBlockSchema,
  faqBlockSchema,
  validateBlockContent,
} from '@/features/content/blocks/schemas'

// ── heroBlockSchema ───────────────────────────────────────────────────────────

describe('heroBlockSchema', () => {
  const valid = {
    headline: 'Transforming Leaders Through Action Learning',
    subheadline: 'Join thousands of certified coaches worldwide.',
    cta_primary_text: 'Find a Coach',
    cta_primary_href: 'https://wial.org/coaches',
  }

  it('accepts a complete valid hero block', () => {
    expect(heroBlockSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts a minimal hero block (headline only)', () => {
    expect(heroBlockSchema.safeParse({ headline: 'Welcome' }).success).toBe(true)
  })

  it('rejects empty headline', () => {
    expect(heroBlockSchema.safeParse({ headline: '' }).success).toBe(false)
  })

  it('rejects headline over 120 chars', () => {
    expect(heroBlockSchema.safeParse({ headline: 'a'.repeat(121) }).success).toBe(false)
  })

  it('rejects invalid CTA URL', () => {
    expect(heroBlockSchema.safeParse({ ...valid, cta_primary_href: 'not-a-url' }).success).toBe(
      false
    )
  })

  it('allows empty string for optional URL fields', () => {
    expect(heroBlockSchema.safeParse({ ...valid, cta_primary_href: '' }).success).toBe(true)
  })
})

// ── textBlockSchema ───────────────────────────────────────────────────────────

describe('textBlockSchema', () => {
  it('accepts an empty text block', () => {
    expect(textBlockSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a heading + tiptap JSON body', () => {
    expect(
      textBlockSchema.safeParse({
        heading: 'About Us',
        body: { type: 'doc', content: [] },
      }).success
    ).toBe(true)
  })

  it('rejects heading over 120 chars', () => {
    expect(textBlockSchema.safeParse({ heading: 'a'.repeat(121) }).success).toBe(false)
  })
})

// ── imageBlockSchema ──────────────────────────────────────────────────────────

describe('imageBlockSchema', () => {
  const valid = {
    src: 'https://example.com/image.jpg',
    alt: 'A group of coaches',
  }

  it('accepts a valid image block', () => {
    expect(imageBlockSchema.safeParse(valid).success).toBe(true)
  })

  it('requires a valid src URL', () => {
    expect(imageBlockSchema.safeParse({ ...valid, src: 'not-a-url' }).success).toBe(false)
  })

  it('uses empty string as default alt', () => {
    const result = imageBlockSchema.safeParse({ src: 'https://example.com/img.jpg' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.alt).toBe('')
  })

  it('rejects alt text over 200 chars', () => {
    expect(imageBlockSchema.safeParse({ ...valid, alt: 'a'.repeat(201) }).success).toBe(false)
  })
})

// ── ctaBlockSchema ────────────────────────────────────────────────────────────

describe('ctaBlockSchema', () => {
  const valid = {
    heading: 'Get Certified Today',
    button_text: 'Start Now',
    button_href: 'https://wial.org/certification',
  }

  it('accepts a valid CTA block', () => {
    expect(ctaBlockSchema.safeParse(valid).success).toBe(true)
  })

  it('defaults variant to "dark"', () => {
    const result = ctaBlockSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.variant).toBe('dark')
  })

  it('accepts valid variant values', () => {
    for (const variant of ['dark', 'light', 'accent'] as const) {
      expect(ctaBlockSchema.safeParse({ ...valid, variant }).success).toBe(true)
    }
  })

  it('rejects unknown variant', () => {
    expect(ctaBlockSchema.safeParse({ ...valid, variant: 'primary' }).success).toBe(false)
  })

  it('rejects empty button_text', () => {
    expect(ctaBlockSchema.safeParse({ ...valid, button_text: '' }).success).toBe(false)
  })

  it('rejects invalid button_href', () => {
    expect(ctaBlockSchema.safeParse({ ...valid, button_href: 'not-a-url' }).success).toBe(false)
  })
})

// ── statsBlockSchema ──────────────────────────────────────────────────────────

describe('statsBlockSchema', () => {
  const valid = {
    items: [
      { label: 'Countries', value: '20+' },
      { label: 'Coaches', value: '500+' },
    ],
  }

  it('accepts a valid stats block', () => {
    expect(statsBlockSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty items array', () => {
    expect(statsBlockSchema.safeParse({ items: [] }).success).toBe(false)
  })

  it('rejects more than 8 items', () => {
    const manyItems = Array.from({ length: 9 }, (_, i) => ({
      label: `Stat ${i}`,
      value: String(i),
    }))
    expect(statsBlockSchema.safeParse({ items: manyItems }).success).toBe(false)
  })

  it('rejects item with empty label', () => {
    expect(statsBlockSchema.safeParse({ items: [{ label: '', value: '10' }] }).success).toBe(false)
  })
})

// ── eventListBlockSchema ──────────────────────────────────────────────────────

describe('eventListBlockSchema', () => {
  it('accepts empty config (all defaults)', () => {
    const result = eventListBlockSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.max_count).toBe(3)
      expect(result.data.show_past).toBe(false)
    }
  })

  it('rejects max_count above 20', () => {
    expect(eventListBlockSchema.safeParse({ max_count: 21 }).success).toBe(false)
  })

  it('rejects max_count of 0', () => {
    expect(eventListBlockSchema.safeParse({ max_count: 0 }).success).toBe(false)
  })
})

// ── coachListBlockSchema ──────────────────────────────────────────────────────

describe('coachListBlockSchema', () => {
  it('accepts empty config (all defaults)', () => {
    const result = coachListBlockSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.max_count).toBe(6)
  })

  it('accepts valid certification filter', () => {
    expect(coachListBlockSchema.safeParse({ certification_filter: 'MALC' }).success).toBe(true)
  })

  it('accepts empty string certification filter', () => {
    expect(coachListBlockSchema.safeParse({ certification_filter: '' }).success).toBe(true)
  })

  it('rejects unknown certification filter', () => {
    expect(coachListBlockSchema.safeParse({ certification_filter: 'UNKNOWN' }).success).toBe(false)
  })
})

// ── testimonialBlockSchema ────────────────────────────────────────────────────

describe('testimonialBlockSchema', () => {
  const validItem = {
    quote: 'Action Learning transformed our leadership culture.',
    name: 'Jane Doe',
    title: 'CEO',
    organization: 'Acme Corp',
  }

  it('accepts a valid testimonial block', () => {
    expect(testimonialBlockSchema.safeParse({ items: [validItem] }).success).toBe(true)
  })

  it('rejects empty items array', () => {
    expect(testimonialBlockSchema.safeParse({ items: [] }).success).toBe(false)
  })

  it('rejects items with empty quote', () => {
    expect(testimonialBlockSchema.safeParse({ items: [{ ...validItem, quote: '' }] }).success).toBe(
      false
    )
  })

  it('rejects items with empty name', () => {
    expect(testimonialBlockSchema.safeParse({ items: [{ ...validItem, name: '' }] }).success).toBe(
      false
    )
  })
})

// ── faqBlockSchema ────────────────────────────────────────────────────────────

describe('faqBlockSchema', () => {
  const validItem = {
    question: 'What is Action Learning?',
    answer: 'A process for working on real problems while learning.',
  }

  it('accepts a valid FAQ block', () => {
    expect(faqBlockSchema.safeParse({ items: [validItem] }).success).toBe(true)
  })

  it('rejects more than 20 FAQ items', () => {
    const manyItems = Array.from({ length: 21 }, () => validItem)
    expect(faqBlockSchema.safeParse({ items: manyItems }).success).toBe(false)
  })

  it('rejects items with empty question', () => {
    expect(faqBlockSchema.safeParse({ items: [{ ...validItem, question: '' }] }).success).toBe(
      false
    )
  })

  it('rejects items with empty answer', () => {
    expect(faqBlockSchema.safeParse({ items: [{ ...validItem, answer: '' }] }).success).toBe(false)
  })
})

// ── validateBlockContent ──────────────────────────────────────────────────────

describe('validateBlockContent', () => {
  it('returns parsed data for a valid hero block', () => {
    const result = validateBlockContent('hero', { headline: 'Welcome' })
    expect(result.success).toBe(true)
  })

  it('returns an error for an invalid hero block', () => {
    const result = validateBlockContent('hero', { headline: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBeDefined()
  })

  it('returns an error for an unknown block type', () => {
    const result = validateBlockContent('unknown_type' as never, {})
    expect(result.success).toBe(false)
  })

  it('returns success for a valid stats block', () => {
    const result = validateBlockContent('stats', {
      items: [{ label: 'Countries', value: '20+' }],
    })
    expect(result.success).toBe(true)
  })
})
