import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCoachesAdmin } from '@/features/coaches/queries/getCoachesAdmin'
import { CERTIFICATION_LABELS } from '@/lib/utils/constants'
import { formatDate } from '@/lib/utils/format'
import { CoachStatusToggle } from '@/components/admin/CoachStatusToggle'
import type { CertificationLevel } from '@/types/database'

export const metadata: Metadata = { title: 'Coaches' }
export const revalidate = 0

interface Props {
  params: Promise<{ chapter: string }>
}

export default async function ChapterManageCoachesPage({ params }: Props) {
  const { chapter: chapterSlug } = await params
  const supabase = await createClient()

  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, name')
    .eq('slug', chapterSlug)
    .single()

  if (!chapter) notFound()

  const { items: coaches, total } = await getCoachesAdmin(supabase, {
    chapterId: chapter.id,
    limit: 200,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coaches</h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} coach profile{total !== 1 ? 's' : ''} in {chapter.name}.
        </p>
      </div>

      {coaches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-500">No coaches yet.</p>
          <Link
            href={`/${chapterSlug}/manage/coaches/applications`}
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            View applications →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm" aria-label="Chapter coaches">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Coach
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Level
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Hours
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Published
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Verified
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Certified
                </th>
                <th scope="col" className="px-4 py-3 text-end font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coaches.map((coach) => {
                const name = coach.profile?.full_name ?? 'Unknown'
                return (
                  <tr key={coach.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{name}</p>
                      <p className="text-xs text-gray-400">{coach.profile?.email}</p>
                      {coach.profile_visibility_suspended && (
                        <span className="mt-0.5 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Visibility suspended
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        {coach.certification_level}
                      </span>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {CERTIFICATION_LABELS[coach.certification_level as CertificationLevel]}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{coach.coaching_hours ?? 0}</td>
                    <td className="px-4 py-3">
                      <CoachStatusToggle
                        coachId={coach.id}
                        coachName={name}
                        field="published"
                        currentValue={coach.is_published}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <CoachStatusToggle
                        coachId={coach.id}
                        coachName={name}
                        field="verified"
                        currentValue={coach.is_verified}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {coach.certification_date ? formatDate(coach.certification_date) : '—'}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Link
                        href={`/admin/coaches/${coach.id}`}
                        className="text-xs font-medium text-blue-600 hover:underline"
                        aria-label={`Review ${name}'s profile`}
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
