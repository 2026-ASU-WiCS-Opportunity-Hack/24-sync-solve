'use client'

import { useActionState, useState } from 'react'
import { Button, TextArea } from '@heroui/react'
import { reviewChapterRequestAction } from '@/features/chapters/actions/requestChapter'
import type { ActionResult } from '@/types'

interface ChapterRequestReviewFormProps {
  requestId: string
}

export function ChapterRequestReviewForm({ requestId }: ChapterRequestReviewFormProps) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    reviewChapterRequestAction,
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
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="decision" value={decision ?? ''} />

      {decision === 'rejected' && (
        <div>
          <label
            htmlFor={`reject-notes-${requestId}`}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Reason for rejection{' '}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <TextArea
            id={`reject-notes-${requestId}`}
            name="review_notes"
            required
            rows={2}
            maxLength={1000}
            placeholder="Explain why this request is being rejected…"
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
