'use client'

import { useActionState, useState } from 'react'
import { Button, TextArea } from '@heroui/react'
import { suspendAccountAction, unsuspendAccountAction } from '@/features/rbac/actions/suspension'
import type { ActionResult } from '@/types'

interface AccountSuspensionControlsProps {
  userId: string
  isSuspended: boolean
  suspensionReason?: string | null
}

/**
 * Account-level suspension controls (super_admin only).
 */
export function AccountSuspensionControls({
  userId,
  isSuspended,
  suspensionReason,
}: AccountSuspensionControlsProps) {
  const [showForm, setShowForm] = useState(false)
  const [suspendState, suspendAction, isSuspending] = useActionState<ActionResult | null, FormData>(
    suspendAccountAction,
    null
  )
  const [unsuspendState, unsuspendAction, isUnsuspending] = useActionState<
    ActionResult | null,
    FormData
  >(unsuspendAccountAction, null)

  if (isSuspended) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs font-semibold text-red-700">Account suspended</p>
          {suspensionReason && <p className="mt-0.5 text-xs text-red-600">{suspensionReason}</p>}
        </div>
        <form action={unsuspendAction}>
          <input type="hidden" name="user_id" value={userId} />
          <Button
            type="submit"
            isDisabled={isUnsuspending}
            isPending={isUnsuspending}
            size="sm"
            variant="outline"
            className="rounded-lg text-xs font-semibold"
          >
            {isUnsuspending ? 'Unsuspending…' : 'Unsuspend Account'}
          </Button>
        </form>
        {unsuspendState && !unsuspendState.success && (
          <p className="text-xs text-red-600" role="alert">
            {unsuspendState.error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {!showForm ? (
        <Button
          type="button"
          onPress={() => setShowForm(true)}
          size="sm"
          variant="danger"
          className="rounded-lg text-xs font-semibold"
        >
          Suspend Account
        </Button>
      ) : (
        <form action={suspendAction} className="space-y-2">
          <input type="hidden" name="user_id" value={userId} />
          <div>
            <label
              htmlFor={`suspend-reason-${userId}`}
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Reason for suspension{' '}
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <TextArea
              id={`suspend-reason-${userId}`}
              name="reason"
              required
              rows={2}
              maxLength={500}
              placeholder="Explain why this account is being suspended…"
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              isDisabled={isSuspending}
              isPending={isSuspending}
              size="sm"
              variant="danger"
              className="rounded-lg text-xs font-semibold text-white"
            >
              {isSuspending ? 'Suspending…' : 'Confirm Suspend'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onPress={() => setShowForm(false)}
              className="rounded-lg text-xs font-semibold text-gray-700"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      {suspendState && !suspendState.success && (
        <p className="text-xs text-red-600" role="alert">
          {suspendState.error}
        </p>
      )}
    </div>
  )
}
