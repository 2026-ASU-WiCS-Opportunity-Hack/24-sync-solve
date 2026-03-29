'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@heroui/react'
import { CoachCard } from '@/components/coaches/CoachCard'
import { UnifiedCoachSearch } from '@/components/search/UnifiedCoachSearch'
import { createClient } from '@/lib/supabase/client'
import type { CoachWithBasicProfile } from '@/features/coaches/queries/getCoaches'

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
  const [allCoaches, setAllCoaches] = useState<CoachWithBasicProfile[] | null>(null)
  const [isLoadingAll, setIsLoadingAll] = useState(false)
  const [isAISearchActive, setIsAISearchActive] = useState(false)

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
        router.push(`?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams]
  )

  const hasActiveFilters =
    initialFilters.q ||
    initialFilters.certification ||
    initialFilters.country ||
    initialFilters.chapter

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQ !== initialFilters.q && localQ.trim()) {
        updateFilter('q', localQ)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localQ])

  // Fetch all coaches when filtered search returns no results
  useEffect(() => {
    let isMounted = true

    const fetchAllCoaches = async () => {
      if (hasActiveFilters && initialCoaches.length === 0 && !allCoaches) {
        setIsLoadingAll(true)
        try {
          const supabase = createClient()
          const { data } = await supabase
            .from('coaches')
            .select(
              'id, user_id, headline, country, certifications, profile_image_url, is_published, chapter_id'
            )
            .eq('is_published', true)
            .limit(12)
          if (isMounted && data) {
            setAllCoaches(data as CoachWithBasicProfile[])
          }
        } catch (error) {
          console.error('Failed to fetch all coaches:', error)
        } finally {
          if (isMounted) {
            setIsLoadingAll(false)
          }
        }
      } else if (initialCoaches.length > 0) {
        // Reset when results are found
        setAllCoaches(null)
      }
    }

    fetchAllCoaches()
    return () => {
      isMounted = false
    }
  }, [hasActiveFilters, initialCoaches.length])

  const clearFilters = () => {
    setLocalQ('')
    setAllCoaches(null)
    startTransition(() => {
      router.push('/coaches')
    })
  }

  const t = useTranslations('coaches.directory')
  const coachCount = initialCoaches.length

  return (
    <div className="mx-auto flex w-full flex-1 flex-col gap-8">
      {/* Unified Smart Search */}
      <section aria-labelledby="unified-search-heading">
        <h2 id="unified-search-heading" className="text-wial-navy mb-4 text-xl font-bold">
          Find Your Coach
        </h2>
        <div className="mb-6">
          <UnifiedCoachSearch
            onTextSearch={(q) => updateFilter('q', q)}
            onAISearchModeChange={setIsAISearchActive}
            textSearchPlaceholder={t('searchPlaceholder')}
            searchLabel={t('searchLabel')}
            isTextSearching={isPending}
            currentQuery={initialFilters.q}
          />
        </div>
        <p className="text-xs text-gray-500">
          💡 <strong>Tip:</strong> Try natural language ("I need a leadership coach in Brazil") or
          search by name, certification (PALC, SALC), or location.
        </p>
      </section>

      {/* Results section - Hidden when AI search is active */}
      {!isAISearchActive && (
        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="sr-only">
            Available Coaches
          </h2>
          <div
            className="mb-4 flex items-center justify-between"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="text-sm text-gray-500">
              {isPending ? (
                t('searching')
              ) : (
                <>
                  {coachCount === 0 ? t('coachCountZero') : t('coachCount', { count: coachCount })}
                </>
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
            <>
              {/* No matching results message */}
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

              {/* Show other coaches if filters were applied but no results */}
              {hasActiveFilters && (allCoaches || isLoadingAll) && (
                <div className="mt-12 border-t pt-12">
                  <h3 className="mb-6 text-lg font-semibold text-gray-800">{t('otherCoaches')}</h3>
                  {isLoadingAll ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-48 animate-pulse rounded-2xl bg-white p-4" />
                      ))}
                    </div>
                  ) : allCoaches && allCoaches.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {allCoaches.map((coach) => (
                        <CoachCard key={coach.id} coach={coach} />
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </>
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
        </section>
      )}
    </div>
  )
}
