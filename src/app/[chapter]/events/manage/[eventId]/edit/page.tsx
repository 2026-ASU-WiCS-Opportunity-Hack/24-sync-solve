import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapter'
import { EventForm } from '@/components/events/EventForm'
import { updateEventAction } from '@/features/events/actions/manageEvents'

export const metadata: Metadata = { title: 'Edit Event' }

interface EditEventPageProps {
  params: Promise<{ chapter: string; eventId: string }>
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { chapter: slug, eventId } = await params
  const supabase = await createClient()

  // ── Auth check ─────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/${slug}/events/manage/${eventId}/edit`)
  }

  const [chapter, event] = await Promise.all([
    getChapterBySlug(supabase, slug),
    // getEventById only returns published — we need unpublished too for editing
    supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()
      .then(({ data }) => data),
  ])

  if (!chapter) redirect('/')
  if (!event) notFound()

  // Verify event belongs to this chapter
  if (event.chapter_id !== chapter.id) notFound()

  const boundUpdateAction = updateEventAction.bind(null, chapter.id)

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${slug}/events/manage`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Events Management
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Edit Event</h1>
        <p className="mt-1 truncate text-sm text-gray-500">{event.title}</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <EventForm action={boundUpdateAction} event={event} accentColor={chapter.accent_color} />
      </div>
    </div>
  )
}
