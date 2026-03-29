/**
 * Chapter feature types.
 * Re-exports domain types from @/types and defines chapter-specific shapes.
 */

import type { Chapter, ChapterContext } from '@/types'

export type { Chapter, ChapterContext }

/** Payload for creating a new chapter */
export interface CreateChapterInput {
  slug: string
  name: string
  countryCode: string
  timezone: string
  currency: string
  accentColor: string
  contactEmail: string
}

/** Payload for updating an existing chapter */
export type UpdateChapterInput = Partial<CreateChapterInput> & { id: string }

/** Chapter list item — minimal shape for nav/admin lists */
export type ChapterListItem = Pick<Chapter, 'id' | 'slug' | 'name' | 'country_code' | 'is_active'>
