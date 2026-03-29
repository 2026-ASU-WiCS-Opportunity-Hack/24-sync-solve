import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getChapterBySlug } from '@/features/chapters/queries/getChapterAdmin'
import { ChapterForm } from '@/components/admin/ChapterForm'
import { canPerformInChapter, getPermissionContext } from '@/lib/permissions/context'

export const metadata: Metadata = { title: 'Chapter Settings' }

interface Props {
  params: Promise<{ chapter: string }>
}

export default async function ChapterManageSettingsPage({ params }: Props) {
  const { chapter: chapterSlug } = await params
  const supabase = await createClient()

  const chapter = await getChapterBySlug(supabase, chapterSlug)
  if (!chapter) notFound()

  const ctx = await getPermissionContext()
  if (!ctx) notFound()

  // Verify manage_settings permission
  const canManage =
    ctx.globalRole === 'super_admin' ||
    canPerformInChapter(ctx, chapter.id, 'chapter:manage_settings')

  if (!canManage) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chapter Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update {chapter.name}&apos;s settings and branding.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <ChapterForm chapter={chapter} />
      </div>
    </div>
  )
}
