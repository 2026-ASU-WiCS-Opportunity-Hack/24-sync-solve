import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getPendingApprovals } from '@/features/content/queries/getApprovals'
import { formatDate } from '@/lib/utils/format'
import { ClipboardCheck, CheckCircle2, ExternalLink } from 'lucide-react'
import { ApprovalActions } from '@/components/admin/ApprovalActions'
import { ContentDiff } from '@/components/admin/ContentDiff'
import { BLOCK_REGISTRY } from '@/features/content/blocks/registry'
import type { BlockType } from '@/types'

export const metadata: Metadata = { title: 'Content Approvals' }
export const revalidate = 0

interface Props {
  params: Promise<{ chapter: string }>
}

export default async function ChapterManageApprovalsPage({ params }: Props) {
  const { chapter: chapterSlug } = await params
  const supabase = await createClient()

  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, name')
    .eq('slug', chapterSlug)
    .single()

  if (!chapter) notFound()

  const [tAdmin, tContent] = await Promise.all([
    getTranslations('admin.approvals'),
    getTranslations('content.approvals'),
  ])

  const { items, total } = await getPendingApprovals(supabase, {
    chapterId: chapter.id,
    limit: 50,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Approvals</h1>
        <p className="mt-1 text-sm text-gray-500">
          {total === 0 ? tAdmin('noItems') : tAdmin('pendingCount', { count: total })}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <CheckCircle2 size={36} className="mx-auto mb-3 text-green-300" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-500">{tAdmin('allCaughtUp')}</p>
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
            const pageHref = `/${chapterSlug}/${item.page?.slug ?? ''}`

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm"
                aria-label={`Approval request: ${registryEntry?.label ?? blockType}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck size={16} className="text-amber-600" aria-hidden="true" />
                    <span className="text-sm font-semibold text-gray-800">
                      {registryEntry?.label ?? blockType} — {item.page?.title ?? 'Unknown page'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{formatDate(item.updated_at)}</span>
                    <Link
                      href={pageHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <ExternalLink size={11} aria-hidden="true" />
                      {tAdmin('viewLive')}
                    </Link>
                  </div>
                </div>

                <div className="border-b border-gray-100 px-5 py-4">
                  <ContentDiff
                    published={publishedContent}
                    draft={draftContent}
                    blockType={blockType}
                  />
                </div>

                {registryEntry?.requiresApproval && (
                  <div className="border-b border-gray-100 bg-blue-50 px-5 py-2">
                    <p className="text-xs text-blue-700">{tContent('requiresApprovalNote')}</p>
                  </div>
                )}

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
