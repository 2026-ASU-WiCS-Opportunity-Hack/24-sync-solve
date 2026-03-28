import type { Metadata } from 'next'
import { Calendar, MapPin, Video, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUpcomingEvents } from '@/features/events/queries/getEvents'
import { formatDateRange, formatRelativeTime } from '@/lib/utils/format'
import { eventFilterSchema } from '@/lib/utils/validation'
import { EventFilterBar } from '@/components/events/EventFilterBar'
import type { EventType } from '@/types/database'

export const revalidate = 60 // 1 minute ISR — events update frequently

export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming WIAL workshops, webinars, conferences, and certification programs.',
}

interface EventsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const EVENT_TYPE_BADGE_COLORS: Record<string, string> = {
  workshop: 'bg-blue-50 text-blue-700',
  webinar: 'bg-teal-50 text-teal-700',
  conference: 'bg-purple-50 text-purple-700',
  certification: 'bg-amber-50 text-amber-700',
  networking: 'bg-green-50 text-green-700',
  other: 'bg-gray-100 text-gray-600',
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const rawParams = await searchParams
  const parsed = eventFilterSchema.safeParse({
    type: rawParams['type'],
    upcoming: rawParams['upcoming'],
  })
  const filters = parsed.success ? parsed.data : { upcoming: true }

  const supabase = await createClient()
  const events = await getUpcomingEvents(supabase, {
    limit: 24,
    type: filters.type as EventType | undefined,
    upcoming: filters.upcoming,
  })

  return (
    <>
      <section className="bg-wial-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold">Events</h1>
          <p className="mt-3 text-white/80">
            Upcoming workshops, webinars, conferences, and certification programs.
          </p>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Filter bar */}
          <EventFilterBar
            activeType={(filters.type as string | undefined) ?? ''}
            upcoming={filters.upcoming ?? true}
          />

          {events.length === 0 ? (
            <div className="py-20 text-center">
              <Calendar size={40} className="mx-auto mb-4 text-gray-300" aria-hidden="true" />
              <p className="font-medium text-gray-500">No upcoming events at this time.</p>
              <p className="mt-1 text-sm text-gray-400">Check back soon for new events.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const badgeColor =
                  EVENT_TYPE_BADGE_COLORS[event.event_type] ?? 'bg-gray-100 text-gray-600'

                return (
                  <article
                    key={event.id}
                    className="group flex flex-col rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
                  >
                    {/* Event image */}
                    {event.image_url && (
                      <div className="relative h-40 w-full overflow-hidden rounded-t-2xl bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-6">
                      {/* Type badge + virtual tag */}
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase ${badgeColor}`}
                        >
                          {event.event_type}
                        </span>
                        {event.is_virtual && (
                          <span className="flex items-center gap-1 text-xs text-blue-600">
                            <Video size={11} aria-hidden="true" />
                            Virtual
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-wial-navy flex-1 text-base leading-snug font-semibold">
                        {event.title}
                      </h2>

                      {/* Description excerpt */}
                      {event.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                          {event.description}
                        </p>
                      )}

                      {/* Date + location */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar size={14} aria-hidden="true" />
                          <time dateTime={event.start_date}>
                            {formatDateRange(event.start_date, event.end_date)}
                          </time>
                        </div>
                        {event.location_name && !event.is_virtual && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin size={14} aria-hidden="true" />
                            <span>{event.location_name}</span>
                          </div>
                        )}
                        {/* Relative time */}
                        <p className="text-xs text-gray-400">
                          {formatRelativeTime(event.start_date)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex items-center gap-3">
                        <Link
                          href={`/events/${event.id}`}
                          className="text-wial-red hover:text-wial-red-dark text-sm font-medium"
                          aria-label={`Learn more about ${event.title}`}
                        >
                          Learn more →
                        </Link>

                        {event.registration_url && (
                          <a
                            href={event.registration_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-wial-red hover:bg-wial-red-dark ms-auto inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                            aria-label={`Register for ${event.title} (opens in new tab)`}
                          >
                            Register
                            <ExternalLink size={11} aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
