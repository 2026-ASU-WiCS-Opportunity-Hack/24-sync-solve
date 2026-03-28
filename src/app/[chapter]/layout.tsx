import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapter'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface ChapterLayoutProps {
  children: React.ReactNode
  params: Promise<{ chapter: string }>
}

export async function generateMetadata({ params }: ChapterLayoutProps): Promise<Metadata> {
  const { chapter: slug } = await params
  const supabase = await createClient()
  const chapter = await getChapterBySlug(supabase, slug)

  if (!chapter) return {}

  return {
    title: {
      template: `%s | ${chapter.name}`,
      default: chapter.name,
    },
    description: `${chapter.name} — WIAL regional chapter`,
  }
}

export default async function ChapterLayout({ children, params }: ChapterLayoutProps) {
  const { chapter: slug } = await params

  const supabase = await createClient()
  const chapter = await getChapterBySlug(supabase, slug)

  if (!chapter) {
    notFound()
  }

  return (
    <>
      <Header
        accentColor={chapter.accent_color}
        chapterSlug={chapter.slug}
        chapterName={chapter.name}
      />
      <main
        id="main-content"
        className="flex-1 focus:outline-none"
        tabIndex={-1}
        style={{ '--color-chapter-accent': chapter.accent_color } as React.CSSProperties}
        data-chapter-accent={chapter.accent_color}
      >
        {children}
      </main>
      <Footer />
    </>
  )
}
