import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCoachesAdmin } from '@/features/coaches/queries/getCoachesAdmin'
import { CERTIFICATION_LABELS } from '@/lib/utils/constants'
import { formatDate } from '@/lib/utils/format'
import { CoachStatusToggle } from '@/components/admin/CoachStatusToggle'
import type { CertificationLevel } from '@/types/database'

export const metadata: Metadata = { title: 'Coaches' }

export const revalidate = 0 // Always fresh so toggles reflect immediately

export default async function AdminCoachesPage() {
  const supabase = await createClient()
  const { items: coaches, total } = await getCoachesAdmin(supabase, { limit: 200 })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coaches</h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} coach profile{total !== 1 ? 's' : ''} in the system.{' '}
          <span className="text-gray-400">
            Click ✓/✗ icons to toggle published or verified status.
          </span>
        </p>
      </div>

      {/* Table */}
      {coaches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-500">
            No coach profiles yet. Run the seed script to populate test data.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm" aria-label="Coaches list">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Coach
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Chapter
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Level
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
                  Profile
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coaches.map((coach) => {
                const name = coach.profile?.full_name ?? 'Unknown'
                return (
                  <tr key={coach.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{name}</p>
                        <p className="text-xs text-gray-400">{coach.profile?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {coach.chapter_name ? (
                        <Link
                          href={`/${coach.chapter_slug}`}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                        >
                          {coach.chapter_name}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
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
                      {coach.is_published ? (
                        <Link
                          href={`/coaches/${coach.id}`}
                          target="_blank"
                          className="text-xs text-blue-600 hover:underline"
                          aria-label={`View public profile for ${name}`}
                        >
                          View ↗
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
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
