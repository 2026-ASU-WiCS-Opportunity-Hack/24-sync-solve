import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapter'

interface ManageLayoutProps {
  children: React.ReactNode
  params: Promise<{ chapter: string }>
}

/**
 * Layout for chapter event management pages.
 * Verifies the user has at least chapter_lead or content_editor role.
 */
export default async function ManageLayout({ children, params }: ManageLayoutProps) {
  const { chapter: slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/${slug}/events/manage`)
  }

  const [{ data: profile }, chapter] = await Promise.all([
    supabase.from('profiles').select('role, chapter_id').eq('id', user.id).single(),
    getChapterBySlug(supabase, slug),
  ])

  if (!chapter) redirect('/')

  const isSuperAdmin = profile?.role === 'super_admin'
  const isChapterAdmin =
    (profile?.role === 'chapter_lead' || profile?.role === 'content_editor') &&
    profile?.chapter_id === chapter.id

  if (!isSuperAdmin && !isChapterAdmin) {
    const { data: chapterRole } = await supabase
      .from('user_chapter_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('chapter_id', chapter.id)
      .in('role', ['chapter_lead', 'content_editor'])
      .single()

    if (!chapterRole) {
      redirect(`/${slug}/events`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">{children}</div>
    </div>
  )
}
