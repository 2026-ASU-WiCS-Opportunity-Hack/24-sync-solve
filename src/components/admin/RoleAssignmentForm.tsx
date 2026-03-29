'use client'

import { useActionState } from 'react'
import { updateGlobalRoleAction } from '@/features/rbac/actions/roleManagement'
import { ROLE_LABELS } from '@/lib/utils/constants'
import type { ActionResult, UserRole } from '@/types'

interface RoleAssignmentFormProps {
  userId: string
  currentRole: UserRole
}

const GLOBAL_ROLES: UserRole[] = ['super_admin', 'chapter_lead', 'content_editor', 'coach', 'user']

/**
 * Form to update a user's global role (profiles.role).
 * super_admin only.
 */
export function RoleAssignmentForm({ userId, currentRole }: RoleAssignmentFormProps) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateGlobalRoleAction,
    null
  )

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <label htmlFor={`global-role-${userId}`} className="sr-only">
        Global role for user
      </label>
      <select
        id={`global-role-${userId}`}
        name="role"
        defaultValue={currentRole}
        className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        required
      >
        {GLOBAL_ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role] ?? role}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? '…' : 'Update'}
      </button>
      {state && !state.success && (
        <span className="text-xs text-red-600" role="alert">
          {state.error}
        </span>
      )}
    </form>
  )
}
