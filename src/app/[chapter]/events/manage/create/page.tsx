import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapter'
import { EventForm } from '@/components/events/EventForm'
import { createEventAction } from '@/features/events/actions/manageEvents'

export const metadata: Metadata = { title: 'Create Event' }

interface CreateEventPageProps {
  params: Promise<{ chapter: string }>
}

export default async function CreateEventPage({ params }: CreateEventPageProps) {
  const { chapter: slug } = await params
  const supabase = await createClient()

  // ── Auth check ─────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/${slug}/events/manage/create`)
  }

  const chapter = await getChapterBySlug(supabase, slug)
  if (!chapter) redirect('/')

  // Bind the chapter ID into the action (server actions can't receive extra args)
  const boundCreateAction = createEventAction.bind(null, chapter.id)

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${slug}/events/manage`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Events Management
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Create New Event</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add an event to {chapter.name}&apos;s calendar.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <EventForm action={boundCreateAction} accentColor={chapter.accent_color} />
      </div>
    </div>
  )
}
