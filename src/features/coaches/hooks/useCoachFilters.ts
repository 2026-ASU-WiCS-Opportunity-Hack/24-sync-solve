'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import type { CoachFilters } from '@/features/coaches/types'

/**
 * Manages coach directory filter state via URL search params.
 * Keeps filters shareable and back-button compatible.
 */
export function useCoachFilters(): {
  filters: CoachFilters
  setFilter: (key: keyof CoachFilters, value: string) => void
  clearFilters: () => void
} {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters: CoachFilters = {
    q: searchParams.get('q') ?? undefined,
    certification: searchParams.get('certification') ?? undefined,
    country: searchParams.get('country') ?? undefined,
    cursor: searchParams.get('cursor') ?? undefined,
  }

  const setFilter = useCallback(
    (key: keyof CoachFilters, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset cursor on any filter change
      if (key !== 'cursor') params.delete('cursor')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const clearFilters = useCallback(() => {
    router.push(pathname)
  }, [router, pathname])

  return { filters, setFilter, clearFilters }
}
