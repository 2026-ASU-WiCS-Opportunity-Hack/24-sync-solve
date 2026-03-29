import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getCoaches } from '@/features/coaches/queries/getCoaches'
import { CoachDirectory } from '@/components/coaches/CoachDirectory'
import { coachSearchSchema } from '@/lib/utils/validation'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Find a Coach',
  description:
    'Browse our global directory of 500+ certified Action Learning coaches. Filter by certification level, country, or chapter.',
}

interface CoachesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CoachesPage({ searchParams }: CoachesPageProps) {
  const t = await getTranslations('coaches.directory')
  const params = await searchParams
  const parsed = coachSearchSchema.safeParse({
    q: params['q'],
    certification: params['certification'],
    country: params['country'],
    chapter: params['chapter'],
    cursor: params['cursor'],
  })

  const filters = parsed.success ? parsed.data : {}

  // Get chapter ID from slug if provided
  let chapterId: string | undefined
  if (filters.chapter) {
    const supabase = await createClient()
    const { data: chapter } = await supabase
      .from('chapters')
      .select('id')
      .eq('slug', filters.chapter)
      .single()
    chapterId = chapter?.id
  }

  const supabase = await createClient()

  // Fetch coaches and supporting data in parallel
  const [coachResult, chaptersResult] = await Promise.all([
    getCoaches(supabase, {
      q: filters.q,
      certification: filters.certification,
      country: filters.country,
      chapterId,
      cursor: filters.cursor,
    }),
    supabase.from('chapters').select('id, slug, name').eq('is_active', true).order('name'),
  ])

  return (
    <>
      <section className="bg-wial-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-white/80">{t('subtitle')}</p>
        </div>
      </section>

      <section className="min-h-[60vh] bg-gray-50 py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <CoachDirectory
            initialCoaches={coachResult.items}
            nextCursor={coachResult.nextCursor}
            chapters={chaptersResult.data ?? []}
            initialFilters={{
              q: filters.q ?? '',
              certification: filters.certification ?? '',
              country: filters.country ?? '',
              chapter: filters.chapter ?? '',
            }}
          />
        </div>
      </section>
    </>
  )
}
