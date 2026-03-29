'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'

interface EventFilterBarProps {
  activeType: string
  upcoming: boolean
  search?: string
  sort?: string
}

export function EventFilterBar({
  activeType,
  upcoming,
  search = '',
  sort = '',
}: EventFilterBarProps) {
  const t = useTranslations('events.filterBar')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const searchRef = useRef<HTMLInputElement>(null)

  const EVENT_TYPE_FILTERS = [
    { value: '', label: t('allTypes') },
    { value: 'workshop', label: t('workshop') },
    { value: 'webinar', label: t('webinar') },
    { value: 'conference', label: t('conference') },
    { value: 'certification', label: t('certification') },
    { value: 'networking', label: t('networking') },
  ] as const

  const SORT_OPTIONS = [
    { value: '', label: t('sortDateAsc') },
    { value: 'date_desc', label: t('sortDateDesc') },
    { value: 'title_asc', label: t('sortTitleAsc') },
  ] as const

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const value = searchRef.current?.value.trim() ?? ''
    setFilter('q', value)
  }

  return (
    <div className="space-y-3">
      {/* Search + sort row */}
      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="relative flex-1"
          style={{ minWidth: '200px', maxWidth: '360px' }}
        >
          <label htmlFor="event-search" className="sr-only">
            {t('searchLabel')}
          </label>
          <Search
            size={15}
            className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="event-search"
            ref={searchRef}
            type="search"
            name="q"
            defaultValue={search}
            placeholder={t('searchPlaceholder')}
            disabled={isPending}
            className="focus:border-wial-navy focus:ring-wial-navy w-full rounded-xl border border-gray-200 bg-white py-2 ps-9 pe-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:outline-none disabled:cursor-wait"
          />
        </form>

        <div className="ms-auto flex items-center gap-2">
          <label htmlFor="event-sort" className="sr-only">
            {t('sortLabel')}
          </label>
          <select
            id="event-sort"
            value={sort}
            onChange={(e) => setFilter('sort', e.target.value)}
            disabled={isPending}
            className="focus:border-wial-navy focus:ring-wial-navy rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:ring-1 focus:outline-none disabled:cursor-wait"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Type filter pills + upcoming toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('filterByTypeLabel')}>
          {EVENT_TYPE_FILTERS.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFilter('type', type.value)}
              disabled={isPending}
              aria-pressed={activeType === type.value}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-wait ${
                activeType === type.value
                  ? 'bg-wial-navy text-white'
                  : 'hover:border-wial-navy hover:text-wial-navy border border-gray-200 bg-white text-gray-600'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <label className="ms-auto flex cursor-pointer items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={upcoming}
            onChange={(e) => setFilter('upcoming', e.target.checked ? '' : 'false')}
            className="accent-wial-red h-4 w-4 rounded"
            aria-label={t('upcomingOnlyLabel')}
          />
          {t('upcomingOnly')}
        </label>
      </div>
    </div>
  )
}
