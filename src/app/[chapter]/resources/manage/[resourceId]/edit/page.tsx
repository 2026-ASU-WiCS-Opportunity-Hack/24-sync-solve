import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getResourceById } from '@/features/resources/queries/getResources'
import { getPermissionContext, canPerformInChapter } from '@/lib/permissions/context'
import { ResourceForm } from '@/components/resources/ResourceForm'
import { updateResourceAction } from '@/features/resources/actions/manageResources'

export const metadata: Metadata = { title: 'Edit Resource' }

interface ChapterEditResourcePageProps {
  params: Promise<{ chapter: string; resourceId: string }>
}

export default async function ChapterEditResourcePage({ params }: ChapterEditResourcePageProps) {
  const { chapter: chapterSlug, resourceId } = await params

  const supabase = await createClient()

  const { data: chapterRow } = await supabase
    .from('chapters')
    .select('id, name, slug')
    .eq('slug', chapterSlug)
    .single()

  if (!chapterRow) notFound()

  const ctx = await getPermissionContext()
  if (!ctx || ctx.isSuspended || !canPerformInChapter(ctx, chapterRow.id, 'content:edit')) {
    redirect(`/login?redirect=/${chapterSlug}/resources/manage`)
  }

  const resource = await getResourceById(supabase, resourceId)

  // Verify the resource belongs to this chapter
  if (!resource || resource.chapter_id !== chapterRow.id) notFound()

  const boundAction = updateResourceAction.bind(null, resource.id, resource.chapter_id)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${chapterSlug}/resources/manage`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Manage Resources
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Edit Resource</h1>
        <p className="mt-1 truncate text-sm text-gray-500">{resource.title}</p>
      </div>
      <div className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <ResourceForm
          onSubmit={boundAction}
          initialData={{
            title: resource.title,
            description: resource.description ?? '',
            type: resource.type,
            url: resource.url,
            thumbnail_url: resource.thumbnail_url ?? '',
            category: resource.category ?? '',
            authors: resource.authors ?? undefined,
            presenter: resource.presenter ?? undefined,
            published_year: resource.published_year ?? undefined,
            is_published: resource.is_published,
          }}
          submitLabel="Save Changes"
          cancelHref={`/${chapterSlug}/resources/manage`}
        />
      </div>
    </div>
  )
}
