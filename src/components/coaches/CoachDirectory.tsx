'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Filter } from 'lucide-react'
import { CoachCard } from '@/components/coaches/CoachCard'
import type { CoachWithBasicProfile } from '@/features/coaches/queries/getCoaches'
import { CERTIFICATION_ORDER } from '@/lib/utils/constants'

interface CoachDirectoryProps {
  initialCoaches: CoachWithBasicProfile[]
  nextCursor: string | null
  chapters: Array<{ id: string; slug: string; name: string }>
  initialFilters: {
    q: string
    certification: string
    country: string
    chapter: string
  }
}

export function CoachDirectory({
  initialCoaches,
  nextCursor: initialNextCursor,
  chapters,
  initialFilters,
}: CoachDirectoryProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [localQ, setLocalQ] = useState(initialFilters.q)

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('cursor') // Reset pagination on filter change
      startTransition(() => {
        router.push(`?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  const clearFilters = () => {
    setLocalQ('')
    startTransition(() => {
      router.push('/coaches')
    })
  }

  const hasActiveFilters =
    initialFilters.q ||
    initialFilters.certification ||
    initialFilters.country ||
    initialFilters.chapter

  const coachCount = initialCoaches.length

  return (
    <>
      {/* Search + Filters */}
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Search input */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <label htmlFor="coach-search" className="sr-only">
              Search coaches by name, specialty, or location
            </label>
            <input
              id="coach-search"
              type="search"
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') updateFilter('q', localQ)
              }}
              onBlur={() => {
                if (localQ !== initialFilters.q) updateFilter('q', localQ)
              }}
              placeholder="Search by name, specialty, or location..."
              className="focus:border-wial-navy focus:ring-wial-navy/20 w-full rounded-lg border border-gray-200 py-2.5 ps-9 pe-4 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          {/* Certification filter */}
          <div>
            <label htmlFor="filter-cert" className="sr-only">
              Filter by certification level
            </label>
            <select
              id="filter-cert"
              value={initialFilters.certification}
              onChange={(e) => updateFilter('certification', e.target.value)}
              className="focus:ring-wial-navy/20 rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            >
              <option value="">All levels</option>
              {CERTIFICATION_ORDER.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter filter */}
          <div>
            <label htmlFor="filter-chapter" className="sr-only">
              Filter by chapter
            </label>
            <select
              id="filter-chapter"
              value={initialFilters.chapter}
              onChange={(e) => updateFilter('chapter', e.target.value)}
              className="focus:ring-wial-navy/20 rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            >
              <option value="">All chapters</option>
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.slug}>
                  {ch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              aria-label="Clear all filters"
            >
              <X size={14} aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 flex items-center justify-between" aria-live="polite" aria-atomic="true">
        <p className="text-sm text-gray-500">
          {isPending ? (
            'Searching...'
          ) : (
            <>{coachCount === 0 ? 'No coaches found' : `${coachCount}+ coaches found`}</>
          )}
        </p>
      </div>

      {/* Coach grid */}
      {isPending ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-white p-4" />
          ))}
        </div>
      ) : initialCoaches.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-medium text-gray-500">No coaches found matching your search.</p>
          <p className="mt-2 text-sm text-gray-400">Try adjusting your filters or search terms.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="text-wial-red hover:text-wial-red-dark mt-4 text-sm font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {initialCoaches.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>
      )}

      {/* Load more */}
      {initialNextCursor && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => updateFilter('cursor', initialNextCursor)}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Load more coaches
          </button>
        </div>
      )}
    </>
  )
}
