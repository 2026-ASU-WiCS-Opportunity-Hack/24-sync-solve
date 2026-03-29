import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Calendar, CheckCircle, XCircle, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapter'
import { getChapterEventsForAdmin } from '@/features/events/queries/getEvents'
import { formatDateRange } from '@/lib/utils/format'
import { DeleteEventButton } from '@/components/events/DeleteEventButton'

export const metadata: Metadata = { title: 'Manage Events' }

export const revalidate = 0

interface ChapterEventsManagePageProps {
  params: Promise<{ chapter: string }>
}

export default async function ChapterEventsManagePage({ params }: ChapterEventsManagePageProps) {
  const { chapter: slug } = await params
  const supabase = await createClient()

  // ── Auth check ─────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/${slug}/events/manage`)
  }

  // ── Role check ─────────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, chapter_id')
    .eq('id', user.id)
    .single()

  const chapter = await getChapterBySlug(supabase, slug)
  if (!chapter) redirect('/')

  const isSuperAdmin = profile?.role === 'super_admin'
  const isChapterAdmin =
    (profile?.role === 'chapter_lead' || profile?.role === 'content_editor') &&
    profile?.chapter_id === chapter.id

  if (!isSuperAdmin && !isChapterAdmin) {
    // Also check user_chapter_roles
    const { data: chapterRole } = await supabase
      .from('user_chapter_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('chapter_id', chapter.id)
      .in('role', ['chapter_lead', 'content_editor'])
      .single()

    if (!chapterRole) {
      redirect(`/${slug}/events`)
    }
  }

  // ── Fetch events ────────────────────────────────────────────────────────────
  const { items: events, total } = await getChapterEventsForAdmin(supabase, chapter.id, {
    limit: 50,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Events</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} event{total !== 1 ? 's' : ''} for {chapter.name}
          </p>
        </div>
        <Link
          href={`/${slug}/events/manage/create`}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
          style={{ backgroundColor: chapter.accent_color ?? 'var(--color-wial-navy)' }}
        >
          <Plus size={16} aria-hidden="true" />
          New Event
        </Link>
      </div>

      {/* Events table */}
      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <Calendar size={32} className="mx-auto mb-3 text-gray-300" aria-hidden="true" />
          <p className="font-medium text-gray-500">No events yet.</p>
          <Link
            href={`/${slug}/events/manage/create`}
            className="text-wial-red mt-4 inline-block text-sm font-medium hover:underline"
          >
            Create your first event →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm" aria-label="Chapter events">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Event
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Published
                </th>
                <th scope="col" className="px-4 py-3 text-end font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{event.title}</p>
                    {event.is_virtual && <span className="text-xs text-blue-600">Virtual</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <time dateTime={event.start_date}>
                      {formatDateRange(event.start_date, event.end_date)}
                    </time>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {event.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {event.is_published ? (
                      <CheckCircle size={16} className="text-green-500" aria-label="Published" />
                    ) : (
                      <XCircle size={16} className="text-gray-300" aria-label="Not published" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/${slug}/events/manage/${event.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        aria-label={`Edit ${event.title}`}
                      >
                        <Edit2 size={12} aria-hidden="true" />
                        Edit
                      </Link>
                      <DeleteEventButton
                        eventId={event.id}
                        eventTitle={event.title}
                        chapterId={chapter.id}
                        chapterSlug={slug}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Back to events */}
      <Link href={`/${slug}/events`} className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to public events page
      </Link>
    </div>
  )
}
