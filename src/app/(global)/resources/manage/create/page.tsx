import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPermissionContext } from '@/lib/permissions/context'
import { hasPermission } from '@/lib/permissions/permissions'
import { ResourceForm } from '@/components/resources/ResourceForm'
import { createResourceAction } from '@/features/resources/actions/manageResources'

export const metadata: Metadata = { title: 'Add Resource' }

export default async function CreateResourcePage() {
  const ctx = await getPermissionContext()
  if (!ctx || ctx.isSuspended || !hasPermission(ctx.globalRole, 'content:create')) {
    redirect('/login?redirect=/resources/manage/create')
  }

  const boundAction = createResourceAction.bind(null, null)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/resources/manage" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Manage Resources
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Add Resource</h1>
      </div>
      <div className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <ResourceForm
          onSubmit={boundAction}
          submitLabel="Add Resource"
          cancelHref="/resources/manage"
        />
      </div>
    </div>
  )
}
