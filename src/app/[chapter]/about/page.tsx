import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapter'
import { getPageWithBlocks } from '@/features/content/queries/getPageBlocks'
import { EditablePageRendererWrapper as EditablePageRenderer } from '@/components/editor/EditablePageRendererWrapper'
import { canEditChapter } from '@/lib/utils/serverAuth'

export const revalidate = 3600

interface ChapterAboutPageProps {
  params: Promise<{ chapter: string }>
}

export default async function ChapterAboutPage({ params }: ChapterAboutPageProps) {
  const { chapter: slug } = await params

  const supabase = await createClient()
  const chapter = await getChapterBySlug(supabase, slug)
  if (!chapter) return null

  const isEditor = await canEditChapter(chapter.id)
  const result = await getPageWithBlocks(supabase, chapter.id, 'about', isEditor)

  return result ? (
    <EditablePageRenderer
      initialBlocks={result.blocks}
      pageId={result.page.id}
      chapterId={chapter.id}
      accentColor={chapter.accent_color}
    />
  ) : (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-wial-navy text-4xl font-bold">About {chapter.name}</h1>
        <p className="mt-6 text-gray-600">
          {chapter.name} is a regional chapter of the World Institute for Action Learning, serving
          the {chapter.country_code} region.
        </p>
      </div>
    </div>
  )
}
