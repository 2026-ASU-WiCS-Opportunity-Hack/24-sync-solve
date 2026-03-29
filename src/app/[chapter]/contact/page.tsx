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
        className="relative overflow-hidden py-14 text-center text-white"
        style={{ backgroundColor: chapter.accent_color }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(255,255,255,0.16),transparent_36%)]"
        />
        <div className="relative mx-auto max-w-3xl px-6">
          <h1 className="text-4xl leading-tight font-extrabold sm:text-5xl">
            Contact {chapter.name}
          </h1>
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
