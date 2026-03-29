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
        className="relative overflow-hidden py-14 text-white"
        style={{ backgroundColor: chapter.accent_color ?? 'var(--color-wial-navy)' }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.14),transparent_40%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <h1 className="text-4xl leading-tight font-extrabold sm:text-5xl">Our Coaches</h1>
          <p className="mt-3 text-white/80">Certified Action Learning coaches in {chapter.name}.</p>
        </div>
      </section>

      <section className="min-h-[60vh] bg-white py-12">
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
