import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getChapterMembers } from '@/features/rbac/queries/getUserRoles'
import { getPermissionContext } from '@/lib/permissions/context'
import { hasPermission } from '@/lib/permissions/permissions'
import { UserRoleManager } from '@/components/admin/UserRoleManager'
import { AccountSuspensionControls } from '@/components/admin/SuspensionControls'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/utils/constants'
import type { UserRole } from '@/types'

export const metadata: Metadata = { title: 'Members' }
export const revalidate = 0

interface Props {
  params: Promise<{ chapter: string }>
}

export default async function ChapterManageUsersPage({ params }: Props) {
  const { chapter: chapterSlug } = await params
  const supabase = await createClient()

  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, name')
    .eq('slug', chapterSlug)
    .single()

  if (!chapter) notFound()

  const ctx = await getPermissionContext()
  if (!ctx) notFound()

  const isSuperAdmin = ctx.globalRole === 'super_admin'
  const canSuspendAccounts = isSuperAdmin
  const assignableRoles: UserRole[] = isSuperAdmin
    ? ['chapter_lead', 'content_editor', 'coach']
    : ['content_editor', 'coach']

  const { items: members, total } = await getChapterMembers(supabase, chapter.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} member{total !== 1 ? 's' : ''} in {chapter.name}.
        </p>
      </div>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-500">No members found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm" aria-label="Chapter members">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Member
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Global Role
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Chapter Roles
                </th>
                {canSuspendAccounts && (
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                    Status
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr
                  key={member.id}
                  className={member.isSuspended ? 'bg-red-50' : 'hover:bg-gray-50'}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{member.fullName ?? 'No name'}</p>
                    <p className="text-xs text-gray-400">{member.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[member.globalRole] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {ROLE_LABELS[member.globalRole] ?? member.globalRole}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <UserRoleManager
                      userId={member.id}
                      chapterId={chapter.id}
                      currentRoles={member.chapterRoles}
                      assignableRoles={assignableRoles}
                    />
                  </td>
                  {canSuspendAccounts && (
                    <td className="px-4 py-3">
                      <AccountSuspensionControls
                        userId={member.id}
                        isSuspended={member.isSuspended}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
