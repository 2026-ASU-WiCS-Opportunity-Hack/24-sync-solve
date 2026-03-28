import type { Metadata } from 'next'
import { Calendar, MapPin, Video } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUpcomingEvents } from '@/features/events/queries/getEvents'
import { formatDateRange } from '@/lib/utils/format'

export const revalidate = 60 // 1 minute ISR — events update frequently

export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming WIAL workshops, webinars, conferences, and certification programs.',
}

export default async function EventsPage() {
  const supabase = await createClient()
  const events = await getUpcomingEvents(supabase, { limit: 20 })

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
          {events.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">No upcoming events at this time. Check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-gray-200 p-6 transition-shadow hover:shadow-md"
                >
                  <div className="text-wial-red mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                    <span>{event.event_type}</span>
                    {event.is_virtual && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Video size={12} aria-hidden="true" /> Virtual
                      </span>
                    )}
                  </div>

                  <h2 className="text-wial-navy text-base font-semibold">{event.title}</h2>

                  {event.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{event.description}</p>
                  )}

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
                  </div>

                  {event.registration_url && (
                    <Link
                      href={event.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-wial-red hover:text-wial-red-dark mt-4 inline-block text-sm font-medium"
                      aria-label={`Register for ${event.title} (opens in new tab)`}
                    >
                      Register →
                    </Link>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
