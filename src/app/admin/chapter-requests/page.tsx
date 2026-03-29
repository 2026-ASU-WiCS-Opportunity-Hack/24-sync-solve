import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getChapterRequests } from '@/features/chapters/queries/getChapterRequests'
import { getPendingApplications } from '@/features/coaches/queries/getCoachApplications'
import { formatDate } from '@/lib/utils/format'
import { Building2, BookUser, CheckCircle2, ExternalLink } from 'lucide-react'
import { ChapterRequestReviewForm } from '@/components/admin/ChapterRequestReviewForm'
import { CoachApplicationReviewForm } from '@/components/coaches/CoachApplicationReviewForm'

export const metadata: Metadata = { title: 'Applications' }
export const revalidate = 0

export default async function AdminChapterRequestsPage() {
  const supabase = await createClient()

  const [{ items: chapterRequests, total: totalRequests }, { items: coachApps, total: totalApps }] =
    await Promise.all([
      getChapterRequests(supabase, { status: 'pending', limit: 50 }),
      getPendingApplications(supabase, { status: 'pending', limit: 50 }),
    ])

  const hasItems = chapterRequests.length > 0 || coachApps.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="mt-1 text-sm text-gray-500">
          {totalRequests} pending chapter request{totalRequests !== 1 ? 's' : ''}, {totalApps}{' '}
          pending coach application{totalApps !== 1 ? 's' : ''}.
        </p>
      </div>

      {!hasItems && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <CheckCircle2 size={36} className="mx-auto mb-3 text-green-300" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-500">No pending applications.</p>
        </div>
      )}

      {/* Chapter Requests */}
      {chapterRequests.length > 0 && (
        <section aria-labelledby="chapter-requests-heading">
          <h2
            id="chapter-requests-heading"
            className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800"
          >
            <Building2 size={18} aria-hidden="true" />
            Chapter Requests
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              {totalRequests}
            </span>
          </h2>

          <div className="space-y-4">
            {chapterRequests.map((req) => (
              <article
                key={req.id}
                className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm"
                aria-label={`Chapter request: ${req.name}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-5 py-3">
                  <div>
                    <span className="font-semibold text-gray-900">{req.name}</span>
                    <span className="ms-2 font-mono text-sm text-gray-500">/{req.slug}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(req.created_at)}</span>
                </div>

                <div className="px-5 py-4">
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Country</dt>
                      <dd className="text-gray-900">{req.country_code}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Timezone</dt>
                      <dd className="text-gray-900">{req.timezone}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Currency</dt>
                      <dd className="text-gray-900">{req.currency}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Requested by</dt>
                      <dd className="text-gray-900">
                        {req.requester_name ?? req.requester_email ?? '—'}
                      </dd>
                    </div>
                  </dl>

                  {req.message && (
                    <p className="mt-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700 italic">
                      &ldquo;{req.message}&rdquo;
                    </p>
                  )}

                  {req.contact_email && (
                    <p className="mt-2 text-xs text-gray-500">
                      Contact:{' '}
                      <a
                        href={`mailto:${req.contact_email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {req.contact_email}
                      </a>
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                  <ChapterRequestReviewForm requestId={req.id} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Coach Applications */}
      {coachApps.length > 0 && (
        <section aria-labelledby="coach-applications-heading">
          <h2
            id="coach-applications-heading"
            className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800"
          >
            <BookUser size={18} aria-hidden="true" />
            Coach Applications
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
              {totalApps}
            </span>
          </h2>

          <div className="space-y-4">
            {coachApps.map((app) => (
              <article
                key={app.id}
                className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm"
                aria-label={`Coach application from ${app.applicant_name ?? app.applicant_email}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-blue-50 px-5 py-3">
                  <div>
                    <span className="font-semibold text-gray-900">
                      {app.applicant_name ?? app.applicant_email ?? 'Unknown applicant'}
                    </span>
                    {app.chapter_name && (
                      <span className="ms-2 text-sm text-gray-500">→ {app.chapter_name}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(app.created_at)}</span>
                </div>

                <div className="px-5 py-4">
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Email</dt>
                      <dd className="text-gray-900">{app.applicant_email ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Credly</dt>
                      <dd>
                        {app.credly_url ? (
                          <a
                            href={app.credly_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                            aria-label="View Credly badge (opens in new tab)"
                          >
                            <ExternalLink size={11} aria-hidden="true" />
                            {app.credly_verified ? 'Verified ✓' : 'Unverified'}
                          </a>
                        ) : (
                          '—'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Chapter</dt>
                      <dd className="text-gray-900">{app.chapter_name ?? '—'}</dd>
                    </div>
                  </dl>

                  {app.message && (
                    <p className="mt-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700 italic">
                      &ldquo;{app.message}&rdquo;
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                  <CoachApplicationReviewForm applicationId={app.id} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
