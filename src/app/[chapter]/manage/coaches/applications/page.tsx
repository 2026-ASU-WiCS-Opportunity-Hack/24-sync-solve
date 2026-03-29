import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPendingApplications } from '@/features/coaches/queries/getCoachApplications'
import { CoachApplicationReviewForm } from '@/components/coaches/CoachApplicationReviewForm'
import { formatDate } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Coach Applications' }
export const revalidate = 0

interface Props {
  params: Promise<{ chapter: string }>
}

export default async function ChapterCoachApplicationsPage({ params }: Props) {
  const { chapter: chapterSlug } = await params
  const supabase = await createClient()

  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, name')
    .eq('slug', chapterSlug)
    .single()

  if (!chapter) notFound()

  const { items: applications, total } = await getPendingApplications(supabase, {
    chapterId: chapter.id,
    status: 'pending',
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coach Applications</h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} pending application{total !== 1 ? 's' : ''} for {chapter.name}.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-500">No pending applications.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">
                    {app.applicant_name ?? 'Unknown Applicant'}
                  </p>
                  <p className="text-sm text-gray-500">{app.applicant_email}</p>
                  <p className="mt-1 text-xs text-gray-400">Applied {formatDate(app.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {app.credly_verified ? (
                    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      Credly Verified
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      Unverified Badge
                    </span>
                  )}
                </div>
              </div>

              {app.credly_url && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500">Credly Badge URL</p>
                  <a
                    href={app.credly_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm break-all text-blue-600 hover:underline"
                  >
                    {app.credly_url}
                  </a>
                </div>
              )}

              {app.message && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500">Message</p>
                  <p className="text-sm text-gray-700">{app.message}</p>
                </div>
              )}

              <div className="mt-4 border-t border-gray-100 pt-4">
                <CoachApplicationReviewForm applicationId={app.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
