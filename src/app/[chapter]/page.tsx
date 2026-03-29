import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapter'
import { getPageWithBlocks } from '@/features/content/queries/getPageBlocks'
import { EditablePageRendererWrapper as EditablePageRenderer } from '@/components/editor/EditablePageRendererWrapper'
import { canEditChapter } from '@/lib/utils/serverAuth'

export const revalidate = 3600

interface ChapterHomePageProps {
  params: Promise<{ chapter: string }>
}

export async function generateMetadata({ params }: ChapterHomePageProps): Promise<Metadata> {
  const { chapter: slug } = await params
  const supabase = await createClient()
  const chapter = await getChapterBySlug(supabase, slug)

  if (!chapter) return {}

  return {
    title: `${chapter.name} — Action Learning`,
    description: `${chapter.name} regional chapter of the World Institute for Action Learning.`,
  }
}

export default async function ChapterHomePage({ params }: ChapterHomePageProps) {
  const { chapter: slug } = await params

  const supabase = await createClient()
  const chapter = await getChapterBySlug(supabase, slug)
  if (!chapter) return null // layout.tsx handles notFound

  const isEditor = await canEditChapter(chapter.id)
  const result = await getPageWithBlocks(supabase, chapter.id, 'home', isEditor)

  return result ? (
    <EditablePageRenderer
      initialBlocks={result.blocks}
      pageId={result.page.id}
      chapterId={chapter.id}
      accentColor={chapter.accent_color}
    />
  ) : (
    /* Fallback if no content blocks provisioned yet */
    <div className="bg-wial-navy relative overflow-hidden py-20 text-center text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(204,0,0,0.24),transparent_42%)]"
      />
      <div className="mx-auto max-w-2xl px-6">
        <h1 className="text-4xl leading-tight font-extrabold sm:text-5xl">
          Welcome to {chapter.name}
        </h1>
        <p className="mt-4 text-white/80">
          This chapter is being set up. Check back soon for content.
        </p>
      </div>
    </div>
  )
}
