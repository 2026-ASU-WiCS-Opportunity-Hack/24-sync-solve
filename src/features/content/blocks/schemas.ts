import { z } from 'zod'

// ============================================================
// Shared primitives
// ============================================================

const urlString = z.string().url('Must be a valid URL')
const optionalUrl = z.string().url('Must be a valid URL').optional().or(z.literal(''))

// ============================================================
// Hero block
// ============================================================

export const heroBlockSchema = z.object({
  headline: z.string().min(1, 'Headline is required').max(120),
  subheadline: z.string().max(300).optional(),
  cta_primary_text: z.string().max(60).optional(),
  cta_primary_href: optionalUrl,
  cta_secondary_text: z.string().max(60).optional(),
  cta_secondary_href: optionalUrl,
  background_image_url: optionalUrl,
})

export type HeroBlockContent = z.infer<typeof heroBlockSchema>

// ============================================================
// Text block (supports tiptap ProseMirror JSON)
// ============================================================

export const textBlockSchema = z.object({
  heading: z.string().max(120).optional(),
  body: z.record(z.string(), z.unknown()).optional(),
})

export type TextBlockContent = z.infer<typeof textBlockSchema>

// ============================================================
// Image block
// ============================================================

export const imageBlockSchema = z.object({
  src: urlString,
  alt: z.string().max(200).default(''),
  caption: z.string().max(300).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
})

export type ImageBlockContent = z.infer<typeof imageBlockSchema>

// ============================================================
// CTA block
// ============================================================

export const ctaBlockSchema = z.object({
  heading: z.string().min(1, 'Heading is required').max(120),
  subheading: z.string().max(300).optional(),
  button_text: z.string().min(1, 'Button text is required').max(60),
  button_href: urlString,
  variant: z.enum(['dark', 'light', 'accent']).default('dark'),
})

export type CtaBlockContent = z.infer<typeof ctaBlockSchema>

// ============================================================
// Stats block
// ============================================================

const statItemSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(30),
})

export const statsBlockSchema = z.object({
  heading: z.string().max(120).optional(),
  items: z.array(statItemSchema).min(1, 'At least one stat is required').max(8),
})

export type StatsBlockContent = z.infer<typeof statsBlockSchema>

// ============================================================
// Event list block (config only — events loaded from DB)
// ============================================================

export const eventListBlockSchema = z.object({
  heading: z.string().max(120).optional(),
  max_count: z.number().int().min(1).max(20).default(3),
  show_past: z.boolean().default(false),
})

export type EventListBlockContent = z.infer<typeof eventListBlockSchema>

// ============================================================
// Coach list block (config only — coaches loaded from DB)
// ============================================================

export const coachListBlockSchema = z.object({
  heading: z.string().max(120).optional(),
  max_count: z.number().int().min(1).max(12).default(6),
  certification_filter: z.enum(['CALC', 'PALC', 'SALC', 'MALC', '']).optional().default(''),
})

export type CoachListBlockContent = z.infer<typeof coachListBlockSchema>

// ============================================================
// Testimonial block
// ============================================================

const testimonialItemSchema = z.object({
  quote: z.string().min(1, 'Quote is required').max(500),
  name: z.string().min(1, 'Name is required').max(100),
  title: z.string().max(100).optional(),
  organization: z.string().max(100).optional(),
  photo_url: optionalUrl,
})

export const testimonialBlockSchema = z.object({
  heading: z.string().max(120).optional(),
  items: z.array(testimonialItemSchema).min(1, 'At least one testimonial is required').max(6),
})

export type TestimonialBlockContent = z.infer<typeof testimonialBlockSchema>

// ============================================================
// FAQ block
// ============================================================

const faqItemSchema = z.object({
  question: z.string().min(1, 'Question is required').max(200),
  answer: z.string().min(1, 'Answer is required').max(1000),
})

export const faqBlockSchema = z.object({
  heading: z.string().max(120).optional(),
  items: z.array(faqItemSchema).min(1, 'At least one FAQ is required').max(20),
})

export type FaqBlockContent = z.infer<typeof faqBlockSchema>

// ============================================================
// Contact form block
// ============================================================

export const contactFormBlockSchema = z.object({
  heading: z.string().max(120).default('Get in Touch'),
  subheading: z.string().max(300).optional(),
  recipient_email: z.string().email('Must be a valid email').optional().or(z.literal('')),
})

export type ContactFormBlockContent = z.infer<typeof contactFormBlockSchema>

// ============================================================
// Video block
// ============================================================

export const videoBlockSchema = z.object({
  url: urlString,
  caption: z.string().max(300).optional(),
  aspect: z.enum(['16:9', '4:3', '1:1']).default('16:9'),
})

export type VideoBlockContent = z.infer<typeof videoBlockSchema>

// ============================================================
// Team grid block
// ============================================================

const teamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  title: z.string().max(100).optional(),
  bio: z.string().max(400).optional(),
  photo_url: optionalUrl,
})

export const teamGridBlockSchema = z.object({
  heading: z.string().max(120).optional(),
  members: z.array(teamMemberSchema).min(1, 'At least one member is required').max(16),
})

export type TeamGridBlockContent = z.infer<typeof teamGridBlockSchema>

// ============================================================
// Divider block
// ============================================================

export const dividerBlockSchema = z.object({
  style: z.enum(['line', 'dots', 'wave', 'space']).default('line'),
  spacing: z.enum(['sm', 'md', 'lg']).default('md'),
})

export type DividerBlockContent = z.infer<typeof dividerBlockSchema>

// ============================================================
// Client grid block
// ============================================================

const clientItemSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(100),
  logo_url: optionalUrl,
  website_url: optionalUrl,
  description: z.string().max(200).optional(),
})

export const clientGridSchema = z.object({
  heading: z.string().max(120).optional(),
  clients: z.array(clientItemSchema).min(1, 'At least one client is required').max(24),
})

export type ClientGridBlockContent = z.infer<typeof clientGridSchema>

// ============================================================
// Union type for all block content schemas
// ============================================================

export const BLOCK_SCHEMAS = {
  hero: heroBlockSchema,
  text: textBlockSchema,
  image: imageBlockSchema,
  cta: ctaBlockSchema,
  stats: statsBlockSchema,
  event_list: eventListBlockSchema,
  coach_list: coachListBlockSchema,
  testimonial: testimonialBlockSchema,
  faq: faqBlockSchema,
  contact_form: contactFormBlockSchema,
  video: videoBlockSchema,
  team_grid: teamGridBlockSchema,
  divider: dividerBlockSchema,
  client_grid: clientGridSchema,
} as const

export type BlockType = keyof typeof BLOCK_SCHEMAS

/**
 * Validate block content against its schema.
 * Returns a SafeParseReturn: { success: true, data } or { success: false, error }.
 */
export function validateBlockContent<T extends BlockType>(
  blockType: T,
  content: unknown
): z.ZodSafeParseResult<z.infer<(typeof BLOCK_SCHEMAS)[T]>> {
  const schema = BLOCK_SCHEMAS[blockType as BlockType]
  if (!schema) {
    return {
      success: false,
      error: new z.ZodError([
        { code: 'custom', path: [], message: `Unknown block type: ${String(blockType)}` },
      ]) as z.ZodError<z.infer<(typeof BLOCK_SCHEMAS)[T]>>,
    }
  }
  return schema.safeParse(content) as z.ZodSafeParseResult<z.infer<(typeof BLOCK_SCHEMAS)[T]>>
}
