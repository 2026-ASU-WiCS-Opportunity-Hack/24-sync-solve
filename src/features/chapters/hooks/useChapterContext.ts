'use client'

import { useParams } from 'next/navigation'

/**
 * Returns the current chapter slug from the URL.
 * Must be used within a [chapter] route segment.
 */
export function useChapterSlug(): string | null {
  const params = useParams()
  const chapter = params['chapter']
  return typeof chapter === 'string' ? chapter : null
}
