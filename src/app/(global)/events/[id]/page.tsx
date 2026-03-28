import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Calendar, MapPin, Video, Users, ExternalLink, Clock, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getEventById } from '@/features/events/queries/getEvents'
import { formatDate, formatDateRange } from '@/lib/utils/format'

export const revalidate = 60

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const event = await getEventById(supabase, id)

  if (!event) return { title: 'Event Not Found' }

  return {
    title: event.title,
    description:
      event.description?.slice(0, 160) ??
      `WIAL ${event.event_type} event on ${formatDate(event.start_date)}.`,
  }
}

/** Human-readable event type labels */
const EVENT_TYPE_LABELS: Record<string, string> = {
  workshop: 'Workshop',
  webinar: 'Webinar',
  conference: 'Conference',
  certification: 'Certification Program',
  networking: 'Networking',
  other: 'Event',
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const event = await getEventById(supabase, id)

  if (!event) notFound()

  const typeLabel = EVENT_TYPE_LABELS[event.event_type] ?? event.event_type
  const dateRange = formatDateRange(event.start_date, event.end_date)
  const startTime = formatDate(event.start_date, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  return (
    <>
      {/* Hero */}
      <section className="bg-wial-navy py-12 text-white">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <Link
            href="/events"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
          >
            ← Back to Events
          </Link>

          <div className="flex items-start gap-3">
            <div>
              <div className="text-wial-red mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                <span className="flex items-center gap-1">
                  <Tag size={11} aria-hidden="true" />
                  {typeLabel}
                </span>
                {event.is_virtual && (
                  <span className="flex items-center gap-1 text-blue-300">
                    <Video size={11} aria-hidden="true" />
                    Virtual
                  </span>
                )}
              </div>
              <h1 className="text-3xl leading-tight font-extrabold">{event.title}</h1>
            </div>
          </div>

          {/* Date / location row */}
          <div className="mt-5 flex flex-wrap gap-5 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Calendar size={15} aria-hidden="true" />
              <time dateTime={event.start_date}>{dateRange}</time>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={15} aria-hidden="true" />
              <span>{startTime}</span>
            </div>
            {event.is_virtual ? (
              <div className="flex items-center gap-2">
                <Video size={15} aria-hidden="true" />
                <span>Online</span>
              </div>
            ) : event.location_name ? (
              <div className="flex items-center gap-2">
                <MapPin size={15} aria-hidden="true" />
                <span>{event.location_name}</span>
              </div>
            ) : null}
            {event.max_attendees && (
              <div className="flex items-center gap-2">
                <Users size={15} aria-hidden="true" />
                <span>{event.max_attendees} seats</span>
              </div>
            )}
          </div>

          {/* Register CTA in hero */}
          {event.registration_url && (
            <div className="mt-6">
              <a
                href={event.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-wial-red hover:bg-wial-red-light inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors"
                aria-label={`Register for ${event.title} (opens in new tab)`}
              >
                Register Now
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Description */}
            <div className="space-y-6 lg:col-span-2">
              {event.image_url && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                  <Image
                    src={event.image_url}
                    alt={event.title}
                    width={800}
                    height={400}
                    className="h-56 w-full object-cover"
                  />
                </div>
              )}

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-wial-navy mb-4 text-xl font-semibold">About This Event</h2>
                {event.description ? (
                  <p className="leading-relaxed whitespace-pre-wrap text-gray-700">
                    {event.description}
                  </p>
                ) : (
                  <p className="text-gray-400">No description provided.</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-4 lg:col-span-1">
              {/* Event details */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-wial-navy mb-4 text-sm font-semibold tracking-wider uppercase">
                  Event Details
                </h2>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Type</dt>
                    <dd className="mt-0.5 font-medium text-gray-900">{typeLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Date</dt>
                    <dd className="mt-0.5 font-medium text-gray-900">{dateRange}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Time</dt>
                    <dd className="mt-0.5 font-medium text-gray-900">{startTime}</dd>
                  </div>
                  {event.timezone && (
                    <div>
                      <dt className="text-gray-500">Timezone</dt>
                      <dd className="mt-0.5 font-medium text-gray-900">{event.timezone}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-500">Format</dt>
                    <dd className="mt-0.5 font-medium text-gray-900">
                      {event.is_virtual ? 'Virtual / Online' : 'In Person'}
                    </dd>
                  </div>
                  {event.location_name && !event.is_virtual && (
                    <div>
                      <dt className="text-gray-500">Location</dt>
                      <dd className="mt-0.5 font-medium text-gray-900">{event.location_name}</dd>
                    </div>
                  )}
                  {event.max_attendees && (
                    <div>
                      <dt className="text-gray-500">Capacity</dt>
                      <dd className="mt-0.5 font-medium text-gray-900">
                        {event.max_attendees} attendees
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Virtual link */}
              {event.is_virtual && event.virtual_link && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <h2 className="mb-2 text-sm font-semibold text-blue-800">Join Online</h2>
                  <a
                    href={event.virtual_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"
                  >
                    <Video size={14} aria-hidden="true" />
                    Join Meeting Link
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </div>
              )}

              {/* Register CTA sidebar */}
              {event.registration_url && (
                <a
                  href={event.registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-wial-red hover:bg-wial-red-light block rounded-xl px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors"
                  aria-label={`Register for ${event.title} (opens in new tab)`}
                >
                  Register for This Event
                  <ExternalLink size={13} className="ms-1.5 inline" aria-hidden="true" />
                </a>
              )}

              {/* Back link */}
              <Link
                href="/events"
                className="block text-center text-sm text-gray-500 hover:text-gray-700"
              >
                ← View all events
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
