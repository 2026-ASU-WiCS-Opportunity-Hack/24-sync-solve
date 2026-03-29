'use client'

import { useActionState } from 'react'
import { Button, ListBox, ListBoxItem, Select } from '@heroui/react'
import { assignRoleAction } from '@/features/rbac/actions/roleManagement'
import { ROLE_LABELS } from '@/lib/utils/constants'
import type { ActionResult, UserRole } from '@/types'

interface Chapter {
  id: string
  name: string
}

interface AddChapterRoleFormProps {
  userId: string
  /** All chapters available to assign to. */
  chapters: Chapter[]
  /** Chapter IDs the user already has roles in — excluded from the selector. */
  existingChapterIds: string[]
  /** Roles the actor is allowed to assign. */
  assignableRoles?: UserRole[]
}

const ADMIN_ASSIGNABLE: UserRole[] = ['chapter_lead', 'content_editor', 'coach']

/**
 * Form for assigning a role in a chapter where the user has no existing roles.
 * Rendered on the admin users page; requires super_admin.
 */
export function AddChapterRoleForm({
  userId,
  chapters,
  existingChapterIds,
  assignableRoles = ADMIN_ASSIGNABLE,
}: AddChapterRoleFormProps) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    assignRoleAction,
    null
  )

  const available = chapters.filter((c) => !existingChapterIds.includes(c.id))

  if (available.length === 0) return null

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />

      <div>
        <label htmlFor={`new-chapter-${userId}-trigger`} className="sr-only">
          Chapter
        </label>
        <Select name="chapter_id" isRequired className="min-w-36" aria-label="Chapter">
          <Select.Trigger id={`new-chapter-${userId}-trigger`}>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox aria-label="Chapter">
              {available.map((c) => (
                <ListBoxItem key={c.id} id={c.id} textValue={c.name}>
                  {c.name}
                </ListBoxItem>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <div>
        <label htmlFor={`new-role-${userId}-trigger`} className="sr-only">
          Role
        </label>
        <Select name="role" isRequired className="min-w-32" aria-label="Role">
          <Select.Trigger id={`new-role-${userId}-trigger`}>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox aria-label="Role">
              {assignableRoles.map((r) => (
                <ListBoxItem key={r} id={r} textValue={ROLE_LABELS[r] ?? r}>
                  {ROLE_LABELS[r] ?? r}
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
        className="rounded-lg text-xs font-semibold text-white"
      >
        {isPending ? '…' : '+ Assign'}
      </Button>

      {state && !state.success && (
        <span className="text-xs text-red-600" role="alert">
          {state.error}
        </span>
      )}
      {state?.success && (
        <span className="text-xs text-green-600" role="status">
          {state.message}
        </span>
      )}
    </form>
  )
}
