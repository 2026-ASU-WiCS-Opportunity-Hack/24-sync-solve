import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getUsersAdmin } from '@/features/auth/queries/getUsers'
import { formatDate } from '@/lib/utils/format'
import { ROLE_HIERARCHY, ROLE_LABELS, ROLE_COLORS } from '@/lib/utils/constants'
import { RoleAssignmentForm } from '@/components/admin/RoleAssignmentForm'
import { AccountSuspensionControls } from '@/components/admin/SuspensionControls'
import { UserRoleManager } from '@/components/admin/UserRoleManager'
import { AddChapterRoleForm } from '@/components/admin/AddChapterRoleForm'
import type { UserRole } from '@/types'

export const metadata: Metadata = { title: 'Users' }

export const revalidate = 0

interface ChapterRoleEntry {
  chapterId: string
  chapterName: string
  roles: UserRole[]
}

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { items: users, total } = await getUsersAdmin(supabase, { limit: 100 })

  // Parallel: fetch chapter roles for all users + full chapters list
  const userIds = users.map((u) => u.id)

  const [chapterRolesResult, chaptersResult] = await Promise.all([
    userIds.length > 0
      ? supabase
          .from('user_chapter_roles')
          .select(
            'user_id, chapter_id, role, chapter:chapters!user_chapter_roles_chapter_id_fkey(id, name)'
          )
          .in('user_id', userIds)
          .eq('is_active', true)
      : Promise.resolve({ data: [] }),
    supabase.from('chapters').select('id, name').order('name'),
  ])

  // Group chapter roles by user_id → chapterId → roles[]
  const chapterRolesByUser = new Map<string, ChapterRoleEntry[]>()
  for (const row of (chapterRolesResult.data ?? []) as Array<{
    user_id: string
    chapter_id: string
    role: string
    chapter: { id: string; name: string } | null
  }>) {
    if (!row.chapter) continue
    const entries = chapterRolesByUser.get(row.user_id) ?? []
    const existing = entries.find((e) => e.chapterId === row.chapter_id)
    if (existing) {
      existing.roles.push(row.role as UserRole)
    } else {
      entries.push({
        chapterId: row.chapter_id,
        chapterName: row.chapter.name,
        roles: [row.role as UserRole],
      })
    }
    chapterRolesByUser.set(row.user_id, entries)
  }

  const chapters = (chaptersResult.data ?? []) as { id: string; name: string }[]

  // Role summary counts
  const roleCounts = ROLE_HIERARCHY.reduce<Record<string, number>>((acc, role) => {
    acc[role] = users.filter((u) => u.role === role).length
    return acc
  }, {})
  const suspendedCount = users.filter((u) => u.is_suspended).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} registered user{total !== 1 ? 's' : ''}.
          {suspendedCount > 0 && (
            <span className="ms-2 text-red-600">{suspendedCount} suspended.</span>
          )}
        </p>
      </div>

      {/* Role summary pills */}
      <div className="flex flex-wrap gap-2" aria-label="Users by role">
        {ROLE_HIERARCHY.slice()
          .reverse()
          .map((role) => (
            <span
              key={role}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {ROLE_LABELS[role] ?? role}
              <span className="rounded-full bg-white/60 px-1.5 font-bold">
                {roleCounts[role] ?? 0}
              </span>
            </span>
          ))}
        {suspendedCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Suspended
            <span className="rounded-full bg-white/60 px-1.5 font-bold">{suspendedCount}</span>
          </span>
        )}
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-500">
            No users yet. Run the seed script to create test accounts.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm" aria-label="Users list">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  User
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Global Role
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Chapter Roles
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Joined
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const userChapterRoles = chapterRolesByUser.get(user.id) ?? []
                const existingChapterIds = userChapterRoles.map((e) => e.chapterId)

                return (
                  <tr
                    key={user.id}
                    className={user.is_suspended ? 'bg-red-50' : 'hover:bg-gray-50'}
                  >
                    {/* User info */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name ?? 'No name'}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </td>

                    {/* Global role */}
                    <td className="px-4 py-3">
                      <RoleAssignmentForm userId={user.id} currentRole={user.role} />
                    </td>

                    {/* Chapter roles — multi-role management */}
                    <td className="px-4 py-3">
                      <div className="space-y-3">
                        {/* One UserRoleManager per chapter the user already has roles in */}
                        {userChapterRoles.length > 0 ? (
                          userChapterRoles.map((entry) => (
                            <div key={entry.chapterId}>
                              <p className="mb-1 text-xs font-medium text-gray-500">
                                {entry.chapterName}
                              </p>
                              <UserRoleManager
                                userId={user.id}
                                chapterId={entry.chapterId}
                                currentRoles={entry.roles}
                                assignableRoles={['chapter_lead', 'content_editor', 'coach']}
                              />
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No chapter roles</span>
                        )}

                        {/* Form to add a role in a chapter the user isn't in yet */}
                        <AddChapterRoleForm
                          userId={user.id}
                          chapters={chapters}
                          existingChapterIds={existingChapterIds}
                          assignableRoles={['chapter_lead', 'content_editor', 'coach']}
                        />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {user.is_suspended ? (
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          Active
                        </span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-gray-500">{formatDate(user.created_at)}</td>

                    {/* Suspend / unsuspend */}
                    <td className="px-4 py-3">
                      <AccountSuspensionControls
                        userId={user.id}
                        isSuspended={user.is_suspended ?? false}
                        suspensionReason={user.suspension_reason}
                      />
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
