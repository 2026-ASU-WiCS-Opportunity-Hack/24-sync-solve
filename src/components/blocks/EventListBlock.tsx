import Link from 'next/link'
import { Calendar, MapPin, Video } from 'lucide-react'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUpcomingEvents } from '@/features/events/queries/getEvents'
import { formatDateRange } from '@/lib/utils/format'

const eventListSchema = z.object({
  heading: z.string().optional().default('Upcoming Events'),
  limit: z.number().optional().default(3),
  show_past: z.boolean().optional().default(false),
})

interface EventListBlockProps {
  content: Record<string, unknown>
  chapterId?: string | null
}

export default async function EventListBlock({ content, chapterId }: EventListBlockProps) {
  const parsed = eventListSchema.safeParse(content)
  const data = parsed.success ? parsed.data : eventListSchema.parse({})

  const supabase = await createClient()
  const events = await getUpcomingEvents(supabase, {
    chapterId: chapterId ?? undefined,
    includeGlobal: true,
    limit: data.limit,
  })

  return (
    <section aria-label={data.heading} className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-wial-navy text-3xl font-bold">{data.heading}</h2>
          <Link
            href={chapterId ? `events` : '/events'}
            className="text-wial-red hover:text-wial-red-dark text-sm font-medium"
          >
            View all →
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="text-gray-500">No upcoming events at this time. Check back soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <article
                key={event.id}
                className="hover:shadow-card-hover rounded-2xl border border-gray-200 p-6 transition-shadow"
              >
                <div className="text-wial-red mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                  <span>{event.event_type}</span>
                  {event.is_virtual && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <Video size={12} aria-hidden="true" /> Virtual
                    </span>
                  )}
                </div>

                <h3 className="text-wial-navy text-base leading-snug font-semibold">
                  {event.title}
                </h3>

                <div className="mt-3 space-y-1.5">
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
  )
}
