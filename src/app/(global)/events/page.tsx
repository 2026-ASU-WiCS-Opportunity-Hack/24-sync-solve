import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Settings } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getUpcomingEvents } from '@/features/events/queries/getEvents'
import { eventFilterSchema } from '@/lib/utils/validation'
import { EventFilterBar } from '@/components/events/EventFilterBar'
import { EventCard } from '@/components/events/EventCard'
import type { EventType } from '@/types/database'

export const revalidate = 60 // 1-minute ISR — events update frequently

export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming WIAL workshops, webinars, conferences, and certification programs.',
}

interface EventsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const t = await getTranslations('events.list')
  const rawParams = await searchParams
  const parsed = eventFilterSchema.safeParse({
    type: rawParams['type'],
    upcoming: rawParams['upcoming'],
    q: rawParams['q'],
    sort: rawParams['sort'],
  })
  const filters = parsed.success ? parsed.data : { upcoming: true }

  const supabase = await createClient()

  // ── Fetch events ──────────────────────────────────────────────────────────
  const events = await getUpcomingEvents(supabase, {
    limit: 24,
    type: filters.type as EventType | undefined,
    upcoming: filters.upcoming,
    search: filters.q,
    sort: filters.sort,
  })

  // ── Check if current user can manage events ───────────────────────────────
  let manageHref: string | null = null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, chapter_id')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'super_admin') {
      manageHref = '/admin'
    } else if (
      profile?.chapter_id &&
      (profile.role === 'chapter_lead' || profile.role === 'content_editor')
    ) {
      // Fetch their chapter slug
      const { data: chapter } = await supabase
        .from('chapters')
        .select('slug')
        .eq('id', profile.chapter_id)
        .single()
      if (chapter) manageHref = `/${chapter.slug}/events/manage`
    } else if (user) {
      // Check user_chapter_roles for any active chapter_lead or content_editor role
      const { data: chapterRole } = await supabase
        .from('user_chapter_roles')
        .select('chapter_id, chapters(slug)')
        .eq('user_id', user.id)
        .in('role', ['chapter_lead', 'content_editor'])
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (chapterRole) {
        const chSlug = (chapterRole.chapters as { slug: string } | null)?.slug
        if (chSlug) manageHref = `/${chSlug}/events/manage`
      }
    }
  }

  return (
    <>
      <section className="bg-wial-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold">{t('title')}</h1>
              <p className="mt-3 text-white/80">{t('subtitle')}</p>
            </div>
            {manageHref && (
              <Link
                href={manageHref}
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
          <EventFilterBar
            activeType={(filters.type as string | undefined) ?? ''}
            upcoming={filters.upcoming ?? true}
            search={(filters.q as string | undefined) ?? ''}
            sort={(filters.sort as string | undefined) ?? ''}
          />

          {events.length === 0 ? (
            <div className="py-20 text-center">
              <Calendar size={40} className="mx-auto mb-4 text-gray-300" aria-hidden="true" />
              <p className="font-medium text-gray-500">{t('noEvents')}</p>
              <p className="mt-1 text-sm text-gray-400">{t('checkBack')}</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
