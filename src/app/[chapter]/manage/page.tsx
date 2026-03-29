import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users, GraduationCap, ClipboardCheck, FileText } from 'lucide-react'

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

  // Fetch quick stats
  const [
    { count: memberCount },
    { count: coachCount },
    { count: pendingApplications },
    pendingApprovalsResult,
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
