'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useRef, useTransition } from 'react'
import { Search, Sparkles, X } from 'lucide-react'
import { RESOURCE_TYPE_LABELS } from '@/features/resources/types'
import type { ResourceType } from '@/features/resources/types'
import type { ResourceCollection } from '@/features/resources/utils/collectionFilter'

interface ResourceSearchEngineProps {
  currentSearch: string | null
  currentType: ResourceType | null
  currentCollection: ResourceCollection
}

const TYPES: ResourceType[] = ['video', 'article', 'link']
const COLLECTION_FILTERS: Exclude<ResourceCollection, 'all'>[] = ['journals', 'courses', 'webinars']

export function ResourceSearchEngine({
  currentSearch,
  currentType,
  currentCollection,
}: ResourceSearchEngineProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    startTransition(() => {
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    })
  }

  function handleChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setParam('q', value.trim() || null)
    }, 250)
  }

  function handleFilterChange(filter: 'all' | ResourceType | Exclude<ResourceCollection, 'all'>) {
    const params = new URLSearchParams(searchParams.toString())

    if (filter === 'all') {
      params.delete('type')
      params.delete('collection')
    } else if (TYPES.includes(filter as ResourceType)) {
      params.set('type', filter)
      params.delete('collection')
    } else {
      params.set('collection', filter)
      params.delete('type')
    }

    startTransition(() => {
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    })
  }

  const activeFilter: 'all' | ResourceType | Exclude<ResourceCollection, 'all'> =
    currentType ?? (currentCollection === 'all' ? 'all' : currentCollection)

  const FILTER_LABELS: Record<'all' | ResourceType | Exclude<ResourceCollection, 'all'>, string> = {
    all: 'All',
    video: 'Videos',
    article: 'Articles',
    link: 'Links',
    pdf: 'PDF',
    webinar: 'Webinars',
    journals: 'Journals',
    courses: 'Courses',
    webinars: 'Webinars',
  }

  const tabBase =
    'rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1'
  const tabActive = 'border-wial-red bg-wial-red text-white focus:ring-wial-red'
  const tabInactive = 'border-white/30 bg-white/10 text-white hover:bg-white/20 focus:ring-white/40'

  return (
    <div className="space-y-4">
      <div className="from-wial-navy to-wial-navy/90 rounded-2xl bg-gradient-to-r p-6 text-white shadow-sm">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
          <Sparkles size={14} aria-hidden="true" />
          AI Search Engine
        </div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Find the exact resource fast
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
          Search across videos, articles, links, journals, courses, and webinars in one place.
        </p>

        <div className={`relative mt-5 max-w-3xl ${isPending ? 'opacity-70' : ''}`}>
          <Search
            size={18}
            className="pointer-events-none absolute inset-s-4 top-1/2 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <input
            type="search"
            defaultValue={currentSearch ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Try: leadership development, healthcare teams, action learning"
            className="focus:ring-wial-red/30 focus:border-wial-red w-full rounded-xl border border-white/20 bg-white py-3 ps-11 pe-12 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:outline-none"
            aria-label="Search resources"
          />
          {currentSearch && (
            <button
              type="button"
              onClick={() => setParam('q', null)}
              className="absolute inset-e-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Clear search"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="Filter resources">
          <button
            type="button"
            onClick={() => handleFilterChange('all')}
            className={`${tabBase} ${activeFilter === 'all' ? tabActive : tabInactive}`}
            aria-pressed={activeFilter === 'all'}
          >
            {FILTER_LABELS.all}
          </button>
          {TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleFilterChange(type)}
              className={`${tabBase} ${activeFilter === type ? tabActive : tabInactive}`}
              aria-pressed={activeFilter === type}
            >
              {FILTER_LABELS[type]}
            </button>
          ))}
          {COLLECTION_FILTERS.map((collection) => (
            <button
              key={collection}
              type="button"
              onClick={() => handleFilterChange(collection)}
              className={`${tabBase} ${activeFilter === collection ? tabActive : tabInactive}`}
              aria-pressed={activeFilter === collection}
            >
              {FILTER_LABELS[collection]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
