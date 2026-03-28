import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapter'
import { getUpcomingEvents } from '@/features/events/queries/getEvents'
import { formatDateRange, formatRelativeTime } from '@/lib/utils/format'
import { Calendar, MapPin, Video, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 60

interface ChapterEventsPageProps {
  params: Promise<{ chapter: string }>
}

export default async function ChapterEventsPage({ params }: ChapterEventsPageProps) {
  const { chapter: slug } = await params

  const supabase = await createClient()
  const chapter = await getChapterBySlug(supabase, slug)
  if (!chapter) return null

  const events = await getUpcomingEvents(supabase, {
    chapterId: chapter.id,
    includeGlobal: true,
    limit: 20,
  })

  return (
    <>
      <section className="py-12 text-white" style={{ backgroundColor: chapter.accent_color }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold">Events</h1>
          <p className="mt-3 text-white/80">Upcoming events in {chapter.name}.</p>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {events.length === 0 ? (
            <div className="py-20 text-center">
              <Calendar size={40} className="mx-auto mb-4 text-gray-300" aria-hidden="true" />
              <p className="font-medium text-gray-500">No upcoming events. Check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
                >
                  {/* Event image */}
                  {event.image_url && (
                    <Link
                      href={`/events/${event.id}`}
                      className="relative h-40 w-full overflow-hidden bg-gray-100"
                      aria-label={`View details for ${event.title}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={event.image_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </Link>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className="bg-opacity-10 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase"
                        style={{
                          color: chapter.accent_color || '#1e3a8a',
                          backgroundColor: `${chapter.accent_color || '#1e3a8a'}20`,
                        }}
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

                    <h2 className="text-wial-navy flex-1 text-base leading-snug font-semibold">
                      <Link href={`/events/${event.id}`} className="hover:underline">
                        {event.title}
                      </Link>
                    </h2>

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
                      <p className="text-xs text-gray-400">
                        {formatRelativeTime(event.start_date)}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <Link
                        href={`/events/${event.id}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: chapter.accent_color || '#dc2626' }}
                      >
                        Learn more →
                      </Link>

                      {event.registration_url && (
                        <a
                          href={event.registration_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: chapter.accent_color || '#dc2626' }}
                          aria-label={`Register for ${event.title} (opens in new tab)`}
                        >
                          Register
                          <ExternalLink size={12} aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
