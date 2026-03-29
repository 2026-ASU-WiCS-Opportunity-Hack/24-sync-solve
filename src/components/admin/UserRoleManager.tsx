'use client'

import { useActionState } from 'react'
import { assignRoleAction, revokeRoleAction } from '@/features/rbac/actions/roleManagement'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/utils/constants'
import type { ActionResult, UserRole } from '@/types'

interface UserRoleManagerProps {
  userId: string
  chapterId: string
  currentRoles: UserRole[]
  /** Roles the current actor is allowed to assign */
  assignableRoles?: UserRole[]
}

const CHAPTER_ROLES: UserRole[] = ['chapter_lead', 'content_editor', 'coach']

export function UserRoleManager({
  userId,
  chapterId,
  currentRoles,
  assignableRoles = ['coach', 'content_editor'],
}: UserRoleManagerProps) {
  const [assignState, assignAction, isAssigning] = useActionState<ActionResult | null, FormData>(
    assignRoleAction,
    null
  )
  const [revokeState, revokeAction, isRevoking] = useActionState<ActionResult | null, FormData>(
    revokeRoleAction,
    null
  )

  const availableToAssign = CHAPTER_ROLES.filter(
    (role) => assignableRoles.includes(role) && !currentRoles.includes(role)
  )

  return (
    <div className="space-y-3">
      {/* Current roles */}
      <div className="flex flex-wrap gap-1.5">
        {currentRoles.map((role) => (
          <span
            key={role}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {ROLE_LABELS[role] ?? role}
            {assignableRoles.includes(role) && (
              <form action={revokeAction} className="inline">
                <input type="hidden" name="user_id" value={userId} />
                <input type="hidden" name="chapter_id" value={chapterId} />
                <input type="hidden" name="role" value={role} />
                <button
                  type="submit"
                  disabled={isRevoking}
                  className="ms-0.5 text-current opacity-60 hover:opacity-100 focus:outline-none"
                  aria-label={`Revoke ${ROLE_LABELS[role] ?? role} role`}
                >
                  ×
                </button>
              </form>
            )}
          </span>
        ))}
        {currentRoles.length === 0 && (
          <span className="text-xs text-gray-400">No chapter roles</span>
        )}
      </div>

      {/* Assign role */}
      {availableToAssign.length > 0 && (
        <form action={assignAction} className="flex items-center gap-2">
          <input type="hidden" name="user_id" value={userId} />
          <input type="hidden" name="chapter_id" value={chapterId} />
          <label htmlFor={`role-select-${userId}`} className="sr-only">
            Assign role
          </label>
          <select
            id={`role-select-${userId}`}
            name="role"
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Add role…
            </option>
            {availableToAssign.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role] ?? role}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isAssigning}
            className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isAssigning ? '…' : 'Assign'}
          </button>
        </form>
      )}

      {/* Error feedback */}
      {assignState && !assignState.success && (
        <p className="text-xs text-red-600" role="alert">
          {assignState.error}
        </p>
      )}
      {revokeState && !revokeState.success && (
        <p className="text-xs text-red-600" role="alert">
          {revokeState.error}
        </p>
      )}
    </div>
  )
}
