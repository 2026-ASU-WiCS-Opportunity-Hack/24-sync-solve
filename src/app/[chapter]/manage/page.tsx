import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPaymentStats } from '@/features/payments/queries/getPayments'
import { getCoachGrowth } from '@/features/chapters/queries/getChapterAdmin'
import { formatCurrency } from '@/lib/utils/format'
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  FileText,
  CreditCard,
  TrendingUp,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Chapter Admin' }

export const revalidate = 60

interface ChapterManagePageProps {
  params: Promise<{ chapter: string }>
}

export default async function ChapterManagePage({ params }: ChapterManagePageProps) {
  const { chapter: chapterSlug } = await params
  const supabase = await createClient()

  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, name')
    .eq('slug', chapterSlug)
    .single()

  if (!chapter) notFound()

  // Fetch page IDs for this chapter first (needed for approvals count)
  const { data: chapterPages } = await supabase
    .from('pages')
    .select('id')
    .eq('chapter_id', chapter.id)
  const pageIds = (chapterPages ?? []).map((p) => p.id)

  // Fetch quick stats + analytics in parallel
  const [
    { count: memberCount },
    { count: coachCount },
    { count: pendingApplications },
    pendingApprovalsResult,
    paymentStats,
    coachGrowth,
  ] = await Promise.all([
    supabase
      .from('user_chapter_roles')
      .select('id', { count: 'exact', head: true })
      .eq('chapter_id', chapter.id)
      .eq('is_active', true),
    supabase
      .from('coach_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('chapter_id', chapter.id),
    supabase
      .from('coach_applications')
      .select('id', { count: 'exact', head: true })
      .eq('chapter_id', chapter.id)
      .eq('status', 'pending'),
    pageIds.length > 0
      ? supabase
          .from('content_blocks')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending_approval')
          .in('page_id', pageIds)
      : Promise.resolve({ count: 0 }),
    getPaymentStats(supabase, chapter.id),
    getCoachGrowth(supabase, { chapterId: chapter.id, months: 6 }),
  ])

  const pendingApprovals = pendingApprovalsResult.count ?? 0

  const stats = [
    {
      label: 'Members',
      value: memberCount ?? 0,
      icon: Users,
      href: `/${chapterSlug}/manage/users`,
    },
    {
      label: 'Coaches',
      value: coachCount ?? 0,
      icon: GraduationCap,
      href: `/${chapterSlug}/manage/coaches`,
    },
    {
      label: 'Pending Applications',
      value: pendingApplications ?? 0,
      icon: FileText,
      href: `/${chapterSlug}/manage/coaches/applications`,
      highlight: (pendingApplications ?? 0) > 0,
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals ?? 0,
      icon: ClipboardCheck,
      href: `/${chapterSlug}/manage/approvals`,
      highlight: (pendingApprovals ?? 0) > 0,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{chapter.name} — Chapter Admin</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your chapter&apos;s members, coaches, content, and settings.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href, highlight }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
                highlight ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
              }`}
            >
              <Icon size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Analytics row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Revenue last 30 days */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            <CreditCard size={13} aria-hidden="true" />
            Revenue (30 days)
          </div>
          <p className="text-2xl font-extrabold text-gray-900">
            {formatCurrency(paymentStats.revenueLast30, 'USD')}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {paymentStats.succeededLast30} successful payment
            {paymentStats.succeededLast30 !== 1 ? 's' : ''}
          </p>
          <Link
            href={`/${chapterSlug}/manage/payments`}
            className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
          >
            View details →
          </Link>
        </div>

        {/* Payment conversion rate */}
        {paymentStats.totalLast30 > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
              <TrendingUp size={13} aria-hidden="true" />
              Conversion Rate
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{paymentStats.conversionRate}%</p>
            <p className="mt-1 text-xs text-gray-400">
              {paymentStats.succeededLast30} of {paymentStats.totalLast30} payments succeeded
            </p>
          </div>
        )}

        {/* Coach growth bar chart */}
        {coachGrowth.some((m) => m.count > 0) && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Coach Growth (6 mo)
            </div>
            <div className="flex items-end gap-1.5" aria-label="Coach growth chart" role="img">
              {(() => {
                const max = Math.max(...coachGrowth.map((m) => m.count), 1)
                return coachGrowth.map((m) => (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-gray-700">
                      {m.count > 0 ? m.count : ''}
                    </span>
                    <div
                      className="bg-wial-navy w-full rounded-t"
                      style={{ height: `${Math.max((m.count / max) * 48, 3)}px` }}
                      aria-hidden="true"
                    />
                    <span className="text-[9px] text-gray-400">{m.month.slice(5)}</span>
                  </div>
                ))
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Alert for pending items */}
      {((pendingApplications ?? 0) > 0 || (pendingApprovals ?? 0) > 0) && (
        <div className="space-y-3">
          {(pendingApplications ?? 0) > 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-medium text-amber-800">
                {pendingApplications} coach application{pendingApplications !== 1 ? 's' : ''}{' '}
                awaiting review.
              </p>
              <Link
                href={`/${chapterSlug}/manage/coaches/applications`}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Review
              </Link>
            </div>
          )}
          {(pendingApprovals ?? 0) > 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-medium text-amber-800">
                {pendingApprovals} content block{pendingApprovals !== 1 ? 's' : ''} pending
                approval.
              </p>
              <Link
                href={`/${chapterSlug}/manage/approvals`}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Review
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
