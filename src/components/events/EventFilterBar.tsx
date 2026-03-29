'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'

interface EventFilterBarProps {
  activeType: string
  upcoming: boolean
}

export function EventFilterBar({ activeType, upcoming }: EventFilterBarProps) {
  const t = useTranslations('events.filterBar')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const EVENT_TYPE_FILTERS = [
    { value: '', label: t('allTypes') },
    { value: 'workshop', label: t('workshop') },
    { value: 'webinar', label: t('webinar') },
    { value: 'conference', label: t('conference') },
    { value: 'certification', label: t('certification') },
    { value: 'networking', label: t('networking') },
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

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Event type pills */}
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

      {/* Upcoming / All toggle */}
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
  )
}
