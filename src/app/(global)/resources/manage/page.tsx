import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, CheckCircle, XCircle, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getResources } from '@/features/resources/queries/getResources'
import { getPermissionContext } from '@/lib/permissions/context'
import { hasPermission } from '@/lib/permissions/permissions'
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPE_COLORS } from '@/features/resources/types'
import { DeleteResourceButton } from '@/components/resources/DeleteResourceButton'

export const metadata: Metadata = { title: 'Manage Resources' }
export const revalidate = 0

export default async function ManageResourcesPage() {
  const ctx = await getPermissionContext()
  if (!ctx || ctx.isSuspended || !hasPermission(ctx.globalRole, 'content:create')) {
    redirect('/login?redirect=/resources/manage')
  }

  const supabase = await createClient()
  const { items: resources, total } = await getResources(supabase, {
    globalOnly: true,
    publishedOnly: false,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Resources</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} resource{total !== 1 ? 's' : ''} (global)
          </p>
        </div>
        <Link
          href="/resources/manage/create"
          className="bg-wial-navy hover:bg-wial-navy-dark inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
        >
          <Plus size={16} aria-hidden="true" />
          Add Resource
        </Link>
      </div>

      {/* Table */}
      {resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="font-medium text-gray-500">No resources yet.</p>
          <Link
            href="/resources/manage/create"
            className="text-wial-red mt-4 inline-block text-sm font-medium hover:underline"
          >
            Add your first resource →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm" aria-label="Resources">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Title
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Category
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Published
                </th>
                <th scope="col" className="px-4 py-3 text-end font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{resource.title}</p>
                    <p className="max-w-xs truncate text-xs text-gray-400">{resource.url}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${RESOURCE_TYPE_COLORS[resource.type]}`}
                    >
                      {RESOURCE_TYPE_LABELS[resource.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{resource.category ?? '—'}</td>
                  <td className="px-4 py-3">
                    {resource.is_published ? (
                      <CheckCircle size={16} className="text-green-500" aria-label="Published" />
                    ) : (
                      <XCircle size={16} className="text-gray-300" aria-label="Draft" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/resources/manage/${resource.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        aria-label={`Edit ${resource.title}`}
                      >
                        <Edit2 size={12} aria-hidden="true" />
                        Edit
                      </Link>
                      <DeleteResourceButton
                        resourceId={resource.id}
                        resourceTitle={resource.title}
                        chapterId={null}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link href="/resources" className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to Resources
      </Link>
    </div>
  )
}
