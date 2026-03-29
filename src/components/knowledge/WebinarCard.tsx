import type { Webinar } from '@/features/knowledge/types'
import { CalendarDays, User, Video } from 'lucide-react'
import { WebinarPromoterModal } from './WebinarPromoterModal'

export function WebinarCard({
  webinar,
  canPromote = false,
}: {
  webinar: Webinar
  canPromote?: boolean
}) {
  const date = webinar.scheduled_at
    ? new Date(webinar.scheduled_at).toLocaleDateString([], {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date TBD'

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex-grow p-6">
        <div className="text-wial-red mb-4 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold tracking-wider uppercase">
          {webinar.recording_url ? (
            <>
              <Video className="h-3.5 w-3.5" /> Recording Available
            </>
          ) : (
            <>
              <CalendarDays className="h-3.5 w-3.5" /> Upcoming
            </>
          )}
        </div>
        <h3 className="text-wial-navy mb-2 line-clamp-2 text-xl font-bold">{webinar.title}</h3>
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500">
          {webinar.presenter && (
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" /> {webinar.presenter}
            </span>
          )}
          {webinar.presenter && webinar.scheduled_at && <span className="text-gray-300">•</span>}
          {webinar.scheduled_at && <span>{date}</span>}
        </div>
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600">
          {webinar.description}
        </p>
      </div>
      <div className="flex items-center justify-between rounded-b-xl border-t bg-gray-50 px-6 py-4">
        {webinar.recording_url ? (
          <a
            filter-ignore="true"
            href={webinar.recording_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-wial-navy hover:text-wial-red text-sm font-semibold underline underline-offset-4 transition-colors"
          >
            Watch Recording
          </a>
        ) : (
          <span className="text-sm font-medium text-gray-400">Not yet recorded</span>
        )}

        {canPromote && <WebinarPromoterModal webinarId={webinar.id} title={webinar.title} />}
      </div>
    </div>
  )
}
