'use client'

import { useActionState } from 'react'
import { Button, ListBox, ListBoxItem, Select } from '@heroui/react'
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
                <Button
                  type="submit"
                  isDisabled={isRevoking}
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="ms-0.5 h-3 min-h-3 w-3 min-w-3 opacity-60 hover:opacity-100"
                  aria-label={`Revoke ${ROLE_LABELS[role] ?? role} role`}
                >
                  ×
                </Button>
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
          <div>
            <label
              id={`role-select-${userId}-label`}
              htmlFor={`role-select-${userId}-trigger`}
              className="sr-only"
            >
              Assign role
            </label>
            <Select
              name="role"
              isRequired
              className="min-w-32"
              aria-labelledby={`role-select-${userId}-label`}
            >
              <Select.Trigger id={`role-select-${userId}-trigger`}>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox aria-label="Assign role">
                  {availableToAssign.map((role) => (
                    <ListBoxItem key={role} id={role}>
                      {ROLE_LABELS[role] ?? role}
                    </ListBoxItem>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
          <Button
            type="submit"
            isDisabled={isAssigning}
            isPending={isAssigning}
            size="sm"
            variant="primary"
            className="rounded-lg text-xs font-semibold"
          >
            {isAssigning ? '…' : 'Assign'}
          </Button>
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
