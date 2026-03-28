import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapter'
import { PaymentPage } from '@/components/payments/PaymentPage'

export const revalidate = 3600

interface ChapterPayPageProps {
  params: Promise<{ chapter: string }>
}

export async function generateMetadata({ params }: ChapterPayPageProps): Promise<Metadata> {
  const { chapter: slug } = await params
  const supabase = await createClient()
  const chapter = await getChapterBySlug(supabase, slug)
  if (!chapter) return {}

  return {
    title: 'Dues & Payments',
    description: `Pay certification fees and membership dues for ${chapter.name}.`,
  }
}

export default async function ChapterPayPage({ params }: ChapterPayPageProps) {
  const { chapter: slug } = await params

  const supabase = await createClient()
  const chapter = await getChapterBySlug(supabase, slug)
  if (!chapter) return null // layout.tsx handles notFound

  return (
    <PaymentPage
      chapterSlug={chapter.slug}
      chapterName={chapter.name}
      accentColor={chapter.accent_color ?? '#CC0000'}
      currency={chapter.currency ?? 'USD'}
    />
  )
}
