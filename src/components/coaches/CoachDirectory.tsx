'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button, Input, ListBox, ListBoxItem, Select } from '@heroui/react'
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

  const t = useTranslations('coaches.directory')
  const coachCount = initialCoaches.length

  return (
    <>
      {/* Search + Filters */}
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Search input */}
          <div className="flex-1">
            <div className="relative flex items-center">
              <Search
                size={16}
                className="pointer-events-none absolute inset-s-3 text-gray-400"
                aria-hidden="true"
              />
              <Input
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
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchLabel')}
                className="w-full ps-9"
              />
            </div>
          </div>

          {/* Certification filter */}
          <div>
            <label id="cert-filter-label" htmlFor="cert-filter-trigger" className="sr-only">
              {t('filterCertLabel')}
            </label>
            <Select
              aria-labelledby="cert-filter-label"
              selectedKey={initialFilters.certification || null}
              onSelectionChange={(key) => updateFilter('certification', String(key ?? ''))}
            >
              <Select.Trigger id="cert-filter-trigger">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox aria-label={t('filterCertLabel')}>
                  {CERTIFICATION_ORDER.map((level) => (
                    <ListBoxItem key={level} id={level} textValue={level}>
                      {level}
                    </ListBoxItem>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          {/* Chapter filter */}
          <div>
            <label id="chapter-filter-label" htmlFor="chapter-filter-trigger" className="sr-only">
              {t('filterChapterLabel')}
            </label>
            <Select
              aria-labelledby="chapter-filter-label"
              selectedKey={initialFilters.chapter || null}
              onSelectionChange={(key) => updateFilter('chapter', String(key ?? ''))}
            >
              <Select.Trigger id="chapter-filter-trigger">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox aria-label={t('filterChapterLabel')}>
                  {chapters.map((ch) => (
                    <ListBoxItem key={ch.slug} id={ch.slug} textValue={ch.name}>
                      {ch.name}
                    </ListBoxItem>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              type="button"
              onPress={clearFilters}
              variant="outline"
              aria-label={t('clearFiltersLabel')}
            >
              <X size={14} aria-hidden="true" />
              {t('clearButton')}
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 flex items-center justify-between" aria-live="polite" aria-atomic="true">
        <p className="text-sm text-gray-500">
          {isPending ? (
            t('searching')
          ) : (
            <>{coachCount === 0 ? t('coachCountZero') : t('coachCount', { count: coachCount })}</>
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
          <p className="font-medium text-gray-500">{t('noResults')}</p>
          <p className="mt-2 text-sm text-gray-400">{t('noResultsHint')}</p>
          <Button
            type="button"
            onPress={clearFilters}
            variant="ghost"
            className="text-wial-red hover:text-wial-red-dark mt-4 text-sm font-medium"
          >
            {t('clearAllFilters')}
          </Button>
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
          <Button
            type="button"
            onPress={() => updateFilter('cursor', initialNextCursor)}
            variant="outline"
            className="text-sm font-medium text-gray-700"
          >
            {t('loadMore')}
          </Button>
        </div>
      )}
    </>
  )
}
