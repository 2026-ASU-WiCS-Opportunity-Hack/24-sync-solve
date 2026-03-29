/**
 * Coach feature types.
 * Re-exports domain types from @/types and defines coach-specific shapes.
 */

import type { CoachProfile, CoachWithProfile } from '@/types'

export type { CoachProfile, CoachWithProfile }

/** Filters for querying the coach directory */
export interface CoachFilters {
  q?: string
  certification?: string
  country?: string
  chapterId?: string
  cursor?: string
}

/** Paginated coach result */
export interface CoachListResult {
  items: CoachWithProfile[]
  nextCursor: string | null
}

/** Fields a coach may self-edit (excludes certification_level, is_published, is_verified) */
export type CoachEditableFields = Pick<
  CoachProfile,
  | 'bio'
  | 'photo_url'
  | 'specializations'
  | 'languages'
  | 'location_city'
  | 'location_country'
  | 'contact_email'
  | 'linkedin_url'
>
