import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPermissionContext, canPerformInChapter } from '@/lib/permissions/context'
import { ResourceForm } from '@/components/resources/ResourceForm'
import { createResourceAction } from '@/features/resources/actions/manageResources'

export const metadata: Metadata = { title: 'Add Resource' }

interface ChapterCreateResourcePageProps {
  params: Promise<{ chapter: string }>
}

export default async function ChapterCreateResourcePage({
  params,
}: ChapterCreateResourcePageProps) {
  const { chapter: chapterSlug } = await params

  const supabase = await createClient()

  const { data: chapterRow } = await supabase
    .from('chapters')
    .select('id, name, slug')
    .eq('slug', chapterSlug)
    .single()

  if (!chapterRow) notFound()

  const ctx = await getPermissionContext()
  if (!ctx || ctx.isSuspended || !canPerformInChapter(ctx, chapterRow.id, 'content:create')) {
    redirect(`/login?redirect=/${chapterSlug}/resources/manage/create`)
  }

  const boundAction = createResourceAction.bind(null, chapterRow.id)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${chapterSlug}/resources/manage`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Manage Resources
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Add Resource</h1>
        <p className="mt-1 text-sm text-gray-500">{chapterRow.name}</p>
      </div>
      <div className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <ResourceForm
          onSubmit={boundAction}
          submitLabel="Add Resource"
          cancelHref={`/${chapterSlug}/resources/manage`}
        />
      </div>
    </div>
  )
}
