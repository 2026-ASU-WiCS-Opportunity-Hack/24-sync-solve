import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapter'
import { getCoaches } from '@/features/coaches/queries/getCoaches'
import { CoachDirectory } from '@/components/coaches/CoachDirectory'
import { coachSearchSchema } from '@/lib/utils/validation'

export const revalidate = 60

interface ChapterCoachesPageProps {
  params: Promise<{ chapter: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: ChapterCoachesPageProps): Promise<Metadata> {
  const { chapter: slug } = await params
  const supabase = await createClient()
  const chapter = await getChapterBySlug(supabase, slug)
  if (!chapter) return {}

  return {
    title: `Coaches`,
    description: `Certified Action Learning coaches in ${chapter.name}.`,
  }
}

export default async function ChapterCoachesPage({
  params,
  searchParams,
}: ChapterCoachesPageProps) {
  const [{ chapter: slug }, rawParams] = await Promise.all([params, searchParams])

  const supabase = await createClient()
  const chapter = await getChapterBySlug(supabase, slug)
  if (!chapter) return null

  const parsed = coachSearchSchema.safeParse({
    q: rawParams['q'],
    certification: rawParams['certification'],
    country: rawParams['country'],
    cursor: rawParams['cursor'],
  })
  const filters = parsed.success ? parsed.data : {}

  const coachResult = await getCoaches(supabase, {
    q: filters.q,
    certification: filters.certification,
    country: filters.country,
    chapterId: chapter.id,
    cursor: filters.cursor,
  })

  return (
    <>
      <section
        className="py-12 text-white"
        style={{ backgroundColor: chapter.accent_color ?? 'var(--color-wial-navy)' }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold">Our Coaches</h1>
          <p className="mt-3 text-white/80">Certified Action Learning coaches in {chapter.name}.</p>
        </div>
      </section>

      <section className="min-h-[60vh] bg-gray-50 py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <CoachDirectory
            initialCoaches={coachResult.items}
            nextCursor={coachResult.nextCursor}
            chapters={[]}
            initialFilters={{
              q: filters.q ?? '',
              certification: filters.certification ?? '',
              country: filters.country ?? '',
              chapter: slug,
            }}
          />
        </div>
      </section>
    </>
  )
}
