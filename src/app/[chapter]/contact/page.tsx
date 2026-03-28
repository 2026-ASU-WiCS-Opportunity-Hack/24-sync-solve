import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapter'
import ContactFormBlock from '@/components/blocks/ContactFormBlock'

export const revalidate = 3600

interface ChapterContactPageProps {
  params: Promise<{ chapter: string }>
}

export default async function ChapterContactPage({ params }: ChapterContactPageProps) {
  const { chapter: slug } = await params

  const supabase = await createClient()
  const chapter = await getChapterBySlug(supabase, slug)
  if (!chapter) return null

  return (
    <>
      <section
        className="py-12 text-center text-white"
        style={{ backgroundColor: chapter.accent_color }}
      >
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="text-4xl font-extrabold">Contact {chapter.name}</h1>
          <p className="mt-4 text-white/80">Get in touch with our local chapter team.</p>
        </div>
      </section>
      <ContactFormBlock
        content={{
          heading: `Contact ${chapter.name}`,
          recipient_email: chapter.contact_email ?? undefined,
        }}
        accentColor={chapter.accent_color}
      />
    </>
  )
}
