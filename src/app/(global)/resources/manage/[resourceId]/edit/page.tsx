import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getResourceById } from '@/features/resources/queries/getResources'
import { getPermissionContext } from '@/lib/permissions/context'
import { hasPermission } from '@/lib/permissions/permissions'
import { ResourceForm } from '@/components/resources/ResourceForm'
import { updateResourceAction } from '@/features/resources/actions/manageResources'

export const metadata: Metadata = { title: 'Edit Resource' }

interface EditResourcePageProps {
  params: Promise<{ resourceId: string }>
}

export default async function EditResourcePage({ params }: EditResourcePageProps) {
  const { resourceId } = await params
  const ctx = await getPermissionContext()
  if (!ctx || ctx.isSuspended || !hasPermission(ctx.globalRole, 'content:edit')) {
    redirect('/login?redirect=/resources/manage')
  }

  const supabase = await createClient()
  const resource = await getResourceById(supabase, resourceId)
  if (!resource) notFound()

  const boundAction = updateResourceAction.bind(null, resource.id, resource.chapter_id)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/resources/manage" className="text-sm text-gray-500 hover:text-gray-700">
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
            is_published: resource.is_published,
          }}
          submitLabel="Save Changes"
          cancelHref="/resources/manage"
        />
      </div>
    </div>
  )
}
