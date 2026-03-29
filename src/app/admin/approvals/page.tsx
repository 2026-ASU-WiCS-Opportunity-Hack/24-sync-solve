import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getPendingApprovals } from '@/features/content/queries/getApprovals'
import { formatDate } from '@/lib/utils/format'
import { ClipboardCheck, CheckCircle2, Globe, ExternalLink } from 'lucide-react'
import { ApprovalActions } from '@/components/admin/ApprovalActions'
import { ContentDiff } from '@/components/admin/ContentDiff'
import { BLOCK_REGISTRY } from '@/features/content/blocks/registry'
import type { BlockType } from '@/types'

export const metadata: Metadata = { title: 'Content Approvals' }

export const revalidate = 0 // Always fresh — approvals need real-time status

export default async function AdminApprovalsPage() {
  const supabase = await createClient()
  const { items, total } = await getPendingApprovals(supabase, { limit: 50 })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Approvals</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total === 0
              ? 'No items pending approval.'
              : `${total} item${total !== 1 ? 's' : ''} awaiting your review.`}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <CheckCircle2 size={36} className="mx-auto mb-3 text-green-300" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-500">All caught up! No pending approvals.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const blockType = item.block_type as BlockType
            const registryEntry = BLOCK_REGISTRY[blockType]
            const publishedContent = item.published_version as Record<string, unknown> | null
            const draftContent = (item.draft_version ?? item.content ?? {}) as Record<
              string,
              unknown
            >

            const chapterHref = item.chapter_slug
              ? `/${item.chapter_slug}/${item.page?.slug ?? ''}`
              : `/${item.page?.slug ?? ''}`

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm"
                aria-label={`Approval request: ${registryEntry?.label ?? blockType} on ${item.page?.title ?? 'Unknown page'}`}
              >
                {/* Item header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck
                      size={16}
                      className="shrink-0 text-amber-600"
                      aria-hidden="true"
                    />
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                      <span className="font-semibold text-gray-800">
                        {registryEntry?.label ?? blockType.replace('_', ' ')}
                      </span>
                      <span className="text-gray-400" aria-hidden="true">
                        ·
                      </span>
                      {item.chapter_name ? (
                        <span className="text-gray-600">{item.chapter_name}</span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-600">
                          <Globe size={12} aria-hidden="true" /> Global
                        </span>
                      )}
                      <span className="text-gray-400" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-gray-600">{item.page?.title ?? 'Unknown page'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{formatDate(item.updated_at)}</span>
                    <Link
                      href={chapterHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline focus:outline-none"
                      aria-label={`View live page in new tab`}
                    >
                      <ExternalLink size={11} aria-hidden="true" />
                      View live
                    </Link>
                  </div>
                </div>

                {/* Diff view */}
                <div className="border-b border-gray-100 px-5 py-4">
                  <p className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Proposed changes
                  </p>
                  <ContentDiff
                    published={publishedContent}
                    draft={draftContent}
                    blockType={blockType}
                  />
                </div>

                {/* Requires approval notice */}
                {registryEntry?.requiresApproval && (
                  <div className="border-b border-gray-100 bg-blue-50 px-5 py-2">
                    <p className="text-xs text-blue-700">
                      This block type always requires approval before publishing.
                    </p>
                  </div>
                )}

                {/* Approve / Reject actions */}
                <div className="bg-gray-50 px-5 py-3">
                  <ApprovalActions blockId={item.id} />
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
