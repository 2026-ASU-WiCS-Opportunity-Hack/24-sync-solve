import Link from 'next/link'
import { Calendar, MapPin, Video, ExternalLink } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { Event } from '@/types'
import { formatDateRange, formatRelativeTime } from '@/lib/utils/format'

/** Default badge colors used in global (non-chapter) context */
const TYPE_BADGE_COLORS: Record<string, string> = {
  workshop: 'bg-blue-50 text-blue-700',
  webinar: 'bg-teal-50 text-teal-700',
  conference: 'bg-purple-50 text-purple-700',
  certification: 'bg-amber-50 text-amber-700',
  networking: 'bg-green-50 text-green-700',
  other: 'bg-gray-100 text-gray-600',
}

interface EventCardProps {
  event: Event
  /**
   * Chapter accent color. When provided, the type badge and CTAs use
   * chapter branding instead of the global palette.
   */
  accentColor?: string | null
}

/**
 * EventCard — Server Component.
 * Reusable event card for both global and chapter event listings.
 * Links always point to the global /events/[id] detail page.
 */
export async function EventCard({ event, accentColor }: EventCardProps) {
  const t = await getTranslations('events.list')
  const hasAccent = Boolean(accentColor)

  const badgeClass = [
    'rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase',
    !hasAccent ? (TYPE_BADGE_COLORS[event.event_type] ?? 'bg-gray-100 text-gray-600') : '',
  ]
    .filter(Boolean)
    .join(' ')

  const badgeStyle = hasAccent
    ? { color: accentColor!, backgroundColor: `${accentColor}20` }
    : undefined

  const learnMoreClass = [
    'text-sm font-medium',
    !hasAccent ? 'text-wial-red hover:text-wial-red-dark' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const registerClass = [
    'ms-auto inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors',
    !hasAccent ? 'bg-wial-red hover:bg-wial-red-dark' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md">
      {/* Event image — links to detail page, hidden from AT since title link suffices */}
      {event.image_url && (
        <Link
          href={`/events/${event.id}`}
          className="relative block h-40 w-full overflow-hidden bg-gray-100"
          tabIndex={-1}
          aria-hidden="true"
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
        {/* Type badge + virtual indicator */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={badgeClass} style={badgeStyle}>
            {event.event_type}
          </span>
          {event.is_virtual && (
            <span className="flex items-center gap-1 text-xs text-blue-600">
              <Video size={11} aria-hidden="true" />
              {t('virtual')}
            </span>
          )}
        </div>

        {/* Title — primary link to detail page */}
        <h2 className="text-wial-navy flex-1 text-base leading-snug font-semibold">
          <Link href={`/events/${event.id}`} className="hover:underline">
            {event.title}
          </Link>
        </h2>

        {/* Description excerpt */}
        {event.description && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-500">{event.description}</p>
        )}

        {/* Date, location, relative time */}
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
          <p className="text-xs text-gray-600">{formatRelativeTime(event.start_date)}</p>
        </div>

        {/* CTA row */}
        <div className="mt-4 flex items-center gap-3">
          <Link
            href={`/events/${event.id}`}
            className={learnMoreClass}
            style={hasAccent ? { color: accentColor! } : undefined}
            aria-label={`Learn more about ${event.title}`}
          >
            {t('learnMoreArrow')}
          </Link>

          {event.registration_url && (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className={registerClass}
              style={hasAccent ? { backgroundColor: accentColor! } : undefined}
              aria-label={`Register for ${event.title} (opens in new tab)`}
            >
              {t('register')}
              <ExternalLink size={11} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
