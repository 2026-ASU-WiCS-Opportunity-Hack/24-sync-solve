import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getPendingApprovals } from '@/features/content/queries/getApprovals'
import { formatDate } from '@/lib/utils/format'
import { ClipboardCheck, CheckCircle2, Globe } from 'lucide-react'
import { ApprovalActions } from '@/components/admin/ApprovalActions'

export const metadata: Metadata = { title: 'Approvals' }

export const revalidate = 30

export default async function AdminApprovalsPage() {
  const supabase = await createClient()
  const { items, total } = await getPendingApprovals(supabase, { limit: 50 })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Approvals</h1>
        <p className="mt-1 text-sm text-gray-500">
          {total === 0
            ? 'No items pending approval.'
            : `${total} item${total !== 1 ? 's' : ''} awaiting review.`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <CheckCircle2 size={36} className="mx-auto mb-3 text-green-300" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-500">All caught up! No pending approvals.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm"
            >
              {/* Item header */}
              <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-5 py-3">
                <div className="flex items-center gap-3">
                  <ClipboardCheck size={16} className="text-amber-600" aria-hidden="true" />
                  <div>
                    <span className="text-sm font-semibold text-gray-800">
                      {item.block_type.replace('_', ' ')} block
                    </span>
                    <span className="mx-2 text-gray-400">·</span>
                    <span className="text-sm text-gray-500">
                      {item.chapter_name ? (
                        <Link
                          href={`/${item.chapter_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {item.chapter_name}
                        </Link>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Globe size={12} aria-hidden="true" /> Global
                        </span>
                      )}
                    </span>
                    <span className="mx-2 text-gray-400">·</span>
                    <span className="text-sm text-gray-500">
                      Page: {item.page?.title ?? 'Unknown'}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{formatDate(item.updated_at)}</span>
              </div>

              {/* Draft content preview */}
              <div className="p-5">
                <p className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Proposed changes
                </p>
                <pre className="max-h-48 overflow-auto rounded-lg bg-gray-50 p-3 text-xs whitespace-pre-wrap text-gray-700">
                  {JSON.stringify(item.draft_version ?? item.content, null, 2)}
                </pre>
              </div>

              {/* Approve / Reject actions */}
              {user && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                  <ApprovalActions blockId={item.id} approverUserId={user.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
