import { Calendar, Settings } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapter'
import { getUpcomingEvents } from '@/features/events/queries/getEvents'
import { eventFilterSchema } from '@/lib/utils/validation'
import { EventFilterBar } from '@/components/events/EventFilterBar'
import { EventCard } from '@/components/events/EventCard'
import type { EventType } from '@/types/database'

export const revalidate = 60

interface ChapterEventsPageProps {
  params: Promise<{ chapter: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ChapterEventsPage({ params, searchParams }: ChapterEventsPageProps) {
  const { chapter: slug } = await params
  const rawParams = await searchParams
  const t = await getTranslations('events.list')

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
      <section className="py-12 text-white" style={{ backgroundColor: chapter.accent_color }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold">{t('title')}</h1>
              <p className="mt-3 text-white/80">
                {t('chapterSubtitle', { chapter: chapter.name })}
              </p>
            </div>
            {canManageEvents && (
              <Link
                href={`/${slug}/events/manage`}
                className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                aria-label={t('ariaManageEvents')}
              >
                <Settings size={15} aria-hidden="true" />
                {t('manageEvents')}
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
              <p className="font-medium text-gray-500">{t('noEventsChapter')}</p>
              {canManageEvents && (
                <Link
                  href={`/${slug}/events/manage/create`}
                  className="mt-4 inline-block text-sm font-medium hover:underline"
                  style={{ color: chapter.accent_color }}
                >
                  {t('createFirst')}
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
