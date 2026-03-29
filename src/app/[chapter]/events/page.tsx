import { Calendar, Settings } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapter'
import { getUpcomingEvents } from '@/features/events/queries/getEvents'
import { eventFilterSchema } from '@/lib/utils/validation'
import { EventFilterBar } from '@/components/events/EventFilterBar'
import { EventCard } from '@/components/events/EventCard'
import type { EventType } from '@/types/database'
import { getContrastTextColor, withAlpha } from '@/lib/utils/color'

export const revalidate = 60

interface ChapterEventsPageProps {
  params: Promise<{ chapter: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ChapterEventsPage({ params, searchParams }: ChapterEventsPageProps) {
  const { chapter: slug } = await params
  const rawParams = await searchParams

  const supabase = await createClient()
  const chapter = await getChapterBySlug(supabase, slug)
  if (!chapter) return null

  // ── Parse type / upcoming filters ────────────────────────────────────────
  const parsed = eventFilterSchema.safeParse({
    type: rawParams['type'],
    upcoming: rawParams['upcoming'],
  })
  const filters = parsed.success ? parsed.data : { upcoming: true }

  const events = await getUpcomingEvents(supabase, {
    chapterId: chapter.id,
    includeGlobal: true,
    type: filters.type as EventType | undefined,
    upcoming: filters.upcoming,
    limit: 24,
  })

  const sectionBackground = chapter.accent_color ?? '#003366'
  const headingColor = getContrastTextColor(sectionBackground)
  const subheadingColor = withAlpha(headingColor, 0.82)
  const glowColor = withAlpha(headingColor, 0.2)
  const actionBackground =
    headingColor === '#ffffff' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(11, 31, 58, 0.15)'

  // ── Check if current user can manage chapter events ───────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let canManageEvents = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, chapter_id')
      .eq('id', user.id)
      .single()

    const isSuperAdmin = profile?.role === 'super_admin'
    const isChapterAdmin =
      (profile?.role === 'chapter_lead' || profile?.role === 'content_editor') &&
      profile?.chapter_id === chapter.id

    if (!isSuperAdmin && !isChapterAdmin) {
      const { data: chapterRole } = await supabase
        .from('user_chapter_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('chapter_id', chapter.id)
        .in('role', ['chapter_lead', 'content_editor'])
        .maybeSingle()

      canManageEvents = Boolean(chapterRole)
    } else {
      canManageEvents = isSuperAdmin || isChapterAdmin
    }
  }

  return (
    <>
      <section
        className="relative overflow-hidden py-14 text-white"
        style={{ backgroundColor: sectionBackground, color: headingColor }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(circle at 85% 0%, ${glowColor}, transparent 40%)` }}
        />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl leading-tight font-extrabold sm:text-5xl">Events</h1>
              <p className="mt-3" style={{ color: subheadingColor }}>
                Upcoming events in {chapter.name}.
              </p>
            </div>
            {canManageEvents && (
              <Link
                href={`/${slug}/events/manage`}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold backdrop-blur-sm transition-colors hover:brightness-95"
                style={{ backgroundColor: actionBackground, color: headingColor }}
                aria-label="Manage chapter events"
              >
                <Settings size={15} aria-hidden="true" />
                Manage Events
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Type + upcoming filter bar */}
          <EventFilterBar
            activeType={(filters.type as string | undefined) ?? ''}
            upcoming={filters.upcoming ?? true}
          />

          {events.length === 0 ? (
            <div className="mt-6 py-20 text-center">
              <Calendar size={40} className="mx-auto mb-4 text-gray-300" aria-hidden="true" />
              <p className="font-medium text-gray-500">No upcoming events. Check back soon.</p>
              {canManageEvents && (
                <Link
                  href={`/${slug}/events/manage/create`}
                  className="mt-4 inline-block text-sm font-medium hover:underline"
                  style={{ color: chapter.accent_color }}
                >
                  Create the first event →
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} accentColor={chapter.accent_color} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
