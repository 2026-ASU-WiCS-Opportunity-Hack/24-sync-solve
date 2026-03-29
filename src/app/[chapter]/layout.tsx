import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getChapterBySlug, getAllChapterSlugs } from '@/features/chapters/queries/getChapter'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { EditModeProvider } from '@/components/editor/EditModeProvider'
import { EditModeToggle } from '@/components/editor/EditModeToggle'
import { BackgroundMusicPlayer } from '@/components/chapters/BackgroundMusicPlayer'
import { canEditChapter } from '@/lib/utils/serverAuth'
import type { Json } from '@/types'

/** Shape stored in chapters.settings.background_music */
interface BackgroundMusicSettings {
  url: string
  prompt: string
  enabled: boolean
  duration_seconds?: number
  generated_at?: string
}

function parseBackgroundMusic(settings: Json): BackgroundMusicSettings | null {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return null
  const s = settings as Record<string, Json>
  const music = s['background_music']
  if (!music || typeof music !== 'object' || Array.isArray(music)) return null
  const m = music as Record<string, Json>
  if (typeof m['url'] !== 'string' || typeof m['prompt'] !== 'string') return null
  if (m['enabled'] === false) return null
  return {
    url: m['url'],
    prompt: m['prompt'],
    enabled: true,
    duration_seconds: typeof m['duration_seconds'] === 'number' ? m['duration_seconds'] : undefined,
    generated_at: typeof m['generated_at'] === 'string' ? m['generated_at'] : undefined,
  }
}

/** Pre-render all active chapter routes at build time (SSG) */
export async function generateStaticParams() {
  const supabase = createAdminClient()
  const slugs = await getAllChapterSlugs(supabase)
  return slugs.map((chapter) => ({ chapter }))
}

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

  // Check edit permissions server-side (for UI — auth enforced again in server actions)
  const canEdit = await canEditChapter(chapter.id)

  // isSuperAdmin is resolved separately — chapter leads have canEdit=true but must NOT
  // see edit affordances on the global Header/Footer template regions.
  let isSuperAdmin = false
  if (canEdit) {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single()
      isSuperAdmin = profile?.role === 'super_admin'
    }
  }

  const backgroundMusic = parseBackgroundMusic(chapter.settings)

  return (
    <EditModeProvider canEdit={canEdit} chapterId={chapter.id}>
      <Header
        accentColor={chapter.accent_color}
        chapterSlug={chapter.slug}
        chapterName={chapter.name}
        isSuperAdmin={isSuperAdmin}
      />
      <main
        id="main-content"
        className="flex-1 focus:outline-none"
        tabIndex={-1}
        style={{ '--color-chapter-accent': chapter.accent_color } as React.CSSProperties}
      >
        {children}
      </main>
      <Footer isSuperAdmin={isSuperAdmin} />
      {canEdit && <EditModeToggle />}
      {backgroundMusic && (
        <BackgroundMusicPlayer
          src={backgroundMusic.url}
          prompt={backgroundMusic.prompt}
          chapterSlug={chapter.slug}
        />
      )}
    </EditModeProvider>
  )
}
