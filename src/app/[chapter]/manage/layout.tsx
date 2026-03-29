import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPermissionContext, canPerformInChapter } from '@/lib/permissions/context'
import { ChapterManageSidebar } from '@/components/layout/ChapterManageSidebar'
import { getPendingApplications } from '@/features/coaches/queries/getCoachApplications'

interface ChapterManageLayoutProps {
  children: React.ReactNode
  params: Promise<{ chapter: string }>
}

export default async function ChapterManageLayout({ children, params }: ChapterManageLayoutProps) {
  const { chapter: chapterSlug } = await params

  const supabase = await createClient()

  // Fetch chapter
  const { data: chapterData } = await supabase
    .from('chapters')
    .select('id, name, slug')
    .eq('slug', chapterSlug)
    .single()

  if (!chapterData) notFound()

  // Auth + permission check
  const ctx = await getPermissionContext()

  if (!ctx) {
    redirect(`/login?redirect=/${chapterSlug}/manage`)
  }

  if (ctx.isSuspended) {
    redirect('/suspended')
  }

  // Must be chapter_lead or super_admin for this chapter
  const canManage =
    ctx.globalRole === 'super_admin' ||
    canPerformInChapter(ctx, chapterData.id, 'chapter:manage_settings') ||
    canPerformInChapter(ctx, chapterData.id, 'role:assign_coach')

  if (!canManage) {
    redirect('/dashboard')
  }

  // Badge counts for sidebar
  const { total: pendingApplications } = await getPendingApplications(supabase, {
    chapterId: chapterData.id,
    status: 'pending',
    limit: 1,
  })

  const { data: chapterPages } = await supabase
    .from('pages')
    .select('id')
    .eq('chapter_id', chapterData.id)

  const pageIds = (chapterPages ?? []).map((p) => p.id)
  const { count: pendingApprovals } =
    pageIds.length > 0
      ? await supabase
          .from('content_blocks')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending_approval')
          .in('page_id', pageIds)
      : { count: 0 }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <ChapterManageSidebar
        chapterSlug={chapterSlug}
        chapterName={chapterData.name}
        pendingApplications={pendingApplications}
        pendingApprovals={pendingApprovals ?? 0}
      />
      <main id="main-content" className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
