import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapter'
import { getUpcomingEvents } from '@/features/events/queries/getEvents'
import { formatDateRange } from '@/lib/utils/format'
import { Calendar, MapPin, Video } from 'lucide-react'
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
            <p className="py-12 text-center text-gray-500">No upcoming events. Check back soon.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-gray-200 p-6 transition-shadow hover:shadow-md"
                >
                  <div
                    className="mb-2 text-xs font-semibold tracking-wider uppercase"
                    style={{ color: chapter.accent_color }}
                  >
                    {event.event_type}
                    {event.is_virtual && (
                      <span className="ms-2 inline-flex items-center gap-1 text-blue-600">
                        <Video size={11} aria-hidden="true" /> Virtual
                      </span>
                    )}
                  </div>
                  <h2 className="text-wial-navy text-base font-semibold">{event.title}</h2>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={13} aria-hidden="true" />
                      <time dateTime={event.start_date}>
                        {formatDateRange(event.start_date, event.end_date)}
                      </time>
                    </div>
                    {event.location_name && !event.is_virtual && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin size={13} aria-hidden="true" />
                        {event.location_name}
                      </div>
                    )}
                  </div>
                  {event.registration_url && (
                    <Link
                      href={event.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm font-medium hover:opacity-80"
                      style={{ color: chapter.accent_color }}
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
