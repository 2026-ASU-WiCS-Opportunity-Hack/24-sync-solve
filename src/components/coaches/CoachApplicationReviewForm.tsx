'use client'

import { useActionState, useState } from 'react'
import { Button, TextArea } from '@heroui/react'
import { reviewCoachApplicationAction } from '@/features/coaches/actions/coachApplication'
import type { ActionResult } from '@/types'

interface CoachApplicationReviewFormProps {
  applicationId: string
}

export function CoachApplicationReviewForm({ applicationId }: CoachApplicationReviewFormProps) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    reviewCoachApplicationAction,
    null
  )

  if (state?.success) {
    return (
      <p className="text-sm font-medium text-green-700" role="status">
        {state.message}
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="application_id" value={applicationId} />
      <input type="hidden" name="decision" value={decision ?? ''} />

      {decision === 'rejected' && (
        <div>
          <label
            htmlFor={`notes-${applicationId}`}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Reason for rejection{' '}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <TextArea
            id={`notes-${applicationId}`}
            name="review_notes"
            required
            rows={2}
            maxLength={1000}
            placeholder="Explain why this application is being rejected…"
            className="w-full"
          />
        </div>
      )}

      {state && !state.success && (
        <p className="text-xs text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          isDisabled={isPending}
          isPending={isPending && decision === 'approved'}
          variant="primary"
          onPress={() => setDecision('approved')}
          className="rounded-lg text-sm font-semibold text-white"
        >
          {isPending && decision === 'approved' ? 'Approving…' : 'Approve'}
        </Button>
        <Button
          type={decision === 'rejected' ? 'submit' : 'button'}
          isDisabled={isPending}
          isPending={isPending && decision === 'rejected'}
          variant="danger"
          onPress={() => {
            if (decision !== 'rejected') setDecision('rejected')
          }}
          className="rounded-lg text-sm font-semibold"
        >
          {isPending && decision === 'rejected'
            ? 'Rejecting…'
            : decision === 'rejected'
              ? 'Confirm Reject'
              : 'Reject'}
        </Button>
        {decision === 'rejected' && (
          <Button
            type="button"
            variant="outline"
            onPress={() => setDecision(null)}
            className="rounded-lg text-sm font-medium text-gray-700"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
