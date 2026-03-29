'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import type { EventFilters } from '@/features/events/types'

/**
 * Manages event filter state via URL search params.
 * Keeps filters shareable and back-button compatible.
 */
export function useEventFilters(): {
  filters: EventFilters
  setFilter: (key: keyof EventFilters, value: string) => void
  clearFilters: () => void
} {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters: EventFilters = {
    type: searchParams.get('type') ?? undefined,
    cursor: searchParams.get('cursor') ?? undefined,
  }

  const setFilter = useCallback(
    (key: keyof EventFilters, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
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
