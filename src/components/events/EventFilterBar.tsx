'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

interface EventFilterBarProps {
  activeType: string
  upcoming: boolean
}

const EVENT_TYPES = [
  { value: '', label: 'All Events' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'webinar', label: 'Webinars' },
  { value: 'conference', label: 'Conferences' },
  { value: 'certification', label: 'Certification' },
  { value: 'networking', label: 'Networking' },
] as const

export function EventFilterBar({ activeType, upcoming }: EventFilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

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
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by event type">
        {EVENT_TYPES.map((type) => (
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
          aria-label="Show only upcoming events"
        />
        Upcoming only
      </label>
    </div>
  )
}
