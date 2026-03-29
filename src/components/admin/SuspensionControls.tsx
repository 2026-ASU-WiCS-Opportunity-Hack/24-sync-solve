'use client'

import { useActionState, useState } from 'react'
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
          <button
            type="submit"
            disabled={isUnsuspending}
            className="rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
          >
            {isUnsuspending ? 'Unsuspending…' : 'Unsuspend Account'}
          </button>
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
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
        >
          Suspend Account
        </button>
      ) : (
        <form action={suspendAction} className="space-y-2">
          <input type="hidden" name="user_id" value={userId} />
          <label
            htmlFor={`suspend-reason-${userId}`}
            className="block text-xs font-medium text-gray-700"
          >
            Reason for suspension
          </label>
          <textarea
            id={`suspend-reason-${userId}`}
            name="reason"
            required
            rows={2}
            maxLength={500}
            className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none"
            placeholder="Explain why this account is being suspended…"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSuspending}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isSuspending ? 'Suspending…' : 'Confirm Suspend'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
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
