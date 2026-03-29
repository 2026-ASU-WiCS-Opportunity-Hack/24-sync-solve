import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapter'
import ContactFormBlock from '@/components/blocks/ContactFormBlock'
import { getContrastTextColor, withAlpha } from '@/lib/utils/color'

export const revalidate = 3600

interface ChapterContactPageProps {
  params: Promise<{ chapter: string }>
}

export default async function ChapterContactPage({ params }: ChapterContactPageProps) {
  const { chapter: slug } = await params

  const supabase = await createClient()
  const chapter = await getChapterBySlug(supabase, slug)
  if (!chapter) return null

  const sectionBackground = chapter.accent_color ?? '#003366'
  const headingColor = getContrastTextColor(sectionBackground)
  const subheadingColor = withAlpha(headingColor, 0.82)
  const glowColor = withAlpha(headingColor, 0.2)

  return (
    <>
      <section
        className="relative overflow-hidden py-14 text-center text-white"
        style={{ backgroundColor: sectionBackground, color: headingColor }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(circle at 15% 0%, ${glowColor}, transparent 36%)` }}
        />
        <div className="relative mx-auto max-w-3xl px-6">
          <h1 className="text-4xl leading-tight font-extrabold sm:text-5xl">
            Contact {chapter.name}
          </h1>
          <p className="mt-4" style={{ color: subheadingColor }}>
            Get in touch with our local chapter team.
          </p>
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
