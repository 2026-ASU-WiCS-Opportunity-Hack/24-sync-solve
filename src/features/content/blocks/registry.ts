import type { BlockType } from '@/types'
import type { ComponentType } from 'react'

/**
 * Content block registry.
 * Maps each block_type to its display component, schema, and behavior.
 *
 * Editor components are dynamically imported to keep initial bundle small.
 * Only loaded when edit mode is active.
 */
export interface BlockRegistryEntry {
  /** Human-readable label for the block type */
  label: string
  /** Whether this block requires super admin approval before publishing */
  requiresApproval: boolean
  /** Display component (server-renderable, zero client JS) */
  displayComponent: string // path to dynamic import
  /** Editor component (client only, loaded in edit mode) */
  editorComponent: string // path to dynamic import
  /** Icon name for block picker */
  icon: string
}

export const BLOCK_REGISTRY: Record<BlockType, BlockRegistryEntry> = {
  hero: {
    label: 'Hero Section',
    requiresApproval: true,
    displayComponent: '@/components/blocks/HeroBlock',
    editorComponent: '@/components/editor/blocks/HeroBlockEditor',
    icon: 'layout',
  },
  text: {
    label: 'Text Content',
    requiresApproval: false,
    displayComponent: '@/components/blocks/TextBlock',
    editorComponent: '@/components/editor/blocks/TextBlockEditor',
    icon: 'type',
  },
  image: {
    label: 'Image',
    requiresApproval: false,
    displayComponent: '@/components/blocks/ImageBlock',
    editorComponent: '@/components/editor/blocks/ImageBlockEditor',
    icon: 'image',
  },
  cta: {
    label: 'Call to Action',
    requiresApproval: true,
    displayComponent: '@/components/blocks/CtaBlock',
    editorComponent: '@/components/editor/blocks/CtaBlockEditor',
    icon: 'zap',
  },
  team_grid: {
    label: 'Team Grid',
    requiresApproval: false,
    displayComponent: '@/components/blocks/TeamGridBlock',
    editorComponent: '@/components/editor/blocks/TeamGridBlockEditor',
    icon: 'users',
  },
  coach_list: {
    label: 'Coach List',
    requiresApproval: false,
    displayComponent: '@/components/blocks/CoachListBlock',
    editorComponent: '@/components/editor/blocks/CoachListBlockEditor',
    icon: 'user-check',
  },
  event_list: {
    label: 'Event List',
    requiresApproval: false,
    displayComponent: '@/components/blocks/EventListBlock',
    editorComponent: '@/components/editor/blocks/EventListBlockEditor',
    icon: 'calendar',
  },
  testimonial: {
    label: 'Testimonial',
    requiresApproval: false,
    displayComponent: '@/components/blocks/TestimonialBlock',
    editorComponent: '@/components/editor/blocks/TestimonialBlockEditor',
    icon: 'quote',
  },
  faq: {
    label: 'FAQ',
    requiresApproval: false,
    displayComponent: '@/components/blocks/FaqBlock',
    editorComponent: '@/components/editor/blocks/FaqBlockEditor',
    icon: 'help-circle',
  },
  contact_form: {
    label: 'Contact Form',
    requiresApproval: true,
    displayComponent: '@/components/blocks/ContactFormBlock',
    editorComponent: '@/components/editor/blocks/ContactFormBlockEditor',
    icon: 'mail',
  },
  stats: {
    label: 'Stats',
    requiresApproval: false,
    displayComponent: '@/components/blocks/StatsBlock',
    editorComponent: '@/components/editor/blocks/StatsBlockEditor',
    icon: 'bar-chart-2',
  },
  video: {
    label: 'Video',
    requiresApproval: false,
    displayComponent: '@/components/blocks/VideoBlock',
    editorComponent: '@/components/editor/blocks/VideoBlockEditor',
    icon: 'video',
  },
  divider: {
    label: 'Divider',
    requiresApproval: false,
    displayComponent: '@/components/blocks/DividerBlock',
    editorComponent: '@/components/editor/blocks/DividerBlockEditor',
    icon: 'minus',
  },
  client_grid: {
    label: 'Client Showcase',
    requiresApproval: false,
    displayComponent: '@/components/blocks/ClientGridBlock',
    editorComponent: '@/components/editor/blocks/ClientGridBlockEditor',
    icon: 'building-2',
  },
}

/**
 * Check if a block type requires approval.
 */
export function requiresApproval(blockType: BlockType): boolean {
  return BLOCK_REGISTRY[blockType]?.requiresApproval ?? false
}

// Re-export client-safe display components (for server imports via PageRenderer etc.)
// NOTE: CoachListBlock and EventListBlock are intentionally NOT re-exported here —
// they use `next/headers` via createClient() and can only be imported in Server Components.
// Import them directly from '@/components/blocks/CoachListBlock' in server-only files.
export { default as HeroBlock } from '@/components/blocks/HeroBlock'
export { default as TextBlock } from '@/components/blocks/TextBlock'
export { default as ImageBlock } from '@/components/blocks/ImageBlock'
export { default as CtaBlock } from '@/components/blocks/CtaBlock'
export { default as StatsBlock } from '@/components/blocks/StatsBlock'
export { default as TestimonialBlock } from '@/components/blocks/TestimonialBlock'
export { default as FaqBlock } from '@/components/blocks/FaqBlock'
export { default as ContactFormBlock } from '@/components/blocks/ContactFormBlock'
export { default as VideoBlock } from '@/components/blocks/VideoBlock'
export { default as TeamGridBlock } from '@/components/blocks/TeamGridBlock'
export { default as DividerBlock } from '@/components/blocks/DividerBlock'
export { default as ClientGridBlock } from '@/components/blocks/ClientGridBlock'

// Dynamic export type for block components
export type BlockComponentProps = {
  content: Record<string, unknown>
  chapterId?: string | null
  accentColor?: string
}

export type BlockComponent = ComponentType<BlockComponentProps>
