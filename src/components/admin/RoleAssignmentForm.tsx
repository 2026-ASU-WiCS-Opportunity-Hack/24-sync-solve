'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, ListBox, ListBoxItem, Select } from '@heroui/react'
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
  const t = useTranslations('rbac.roleAssignment')
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateGlobalRoleAction,
    null
  )

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <div>
        <label htmlFor={`global-role-${userId}-trigger`} className="sr-only">
          {t('globalRoleLabel')}
        </label>
        <Select key={currentRole} name="role" isRequired className="min-w-36">
          <Select.Trigger id={`global-role-${userId}-trigger`}>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox aria-label={t('globalRoleLabel')}>
              {GLOBAL_ROLES.map((role) => (
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
        isDisabled={isPending}
        isPending={isPending}
        size="sm"
        variant="primary"
        className="rounded-lg text-xs font-semibold"
      >
        {isPending ? t('updating') : t('updateButton')}
      </Button>
      {state && !state.success && (
        <span className="text-xs text-red-600" role="alert">
          {state.error}
        </span>
      )}
    </form>
  )
}
