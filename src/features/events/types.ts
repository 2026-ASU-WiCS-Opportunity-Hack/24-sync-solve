/**
 * Event feature types.
 * Re-exports domain types from @/types and defines event-specific shapes.
 */

import type { Event } from '@/types'

export type { Event }

/** Filters for querying events */
export interface EventFilters {
  chapterId?: string
  upcoming?: boolean
  type?: string
  cursor?: string
}

/** Payload for creating or updating an event */
export interface EventInput {
  title: string
  description?: string
  eventType: string
  startDate: string
  endDate?: string
  timezone: string
  locationName?: string
  isVirtual: boolean
  virtualLink?: string
  maxAttendees?: number
  registrationUrl?: string
  imageUrl?: string
  isPublished: boolean
}
