'use client'

import { useActionState, useState } from 'react'
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
            className="block text-xs font-medium text-gray-700"
          >
            Reason for rejection <span className="text-red-500">*</span>
          </label>
          <textarea
            id={`reject-notes-${requestId}`}
            name="review_notes"
            required
            rows={2}
            maxLength={1000}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="Explain why this request is being rejected…"
          />
        </div>
      )}

      {state && !state.success && (
        <p className="text-xs text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          onClick={() => setDecision('approved')}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isPending && decision === 'approved' ? 'Approving…' : 'Approve'}
        </button>
        <button
          type={decision === 'rejected' ? 'submit' : 'button'}
          disabled={isPending}
          onClick={() => {
            if (decision !== 'rejected') setDecision('rejected')
          }}
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          {isPending && decision === 'rejected'
            ? 'Rejecting…'
            : decision === 'rejected'
              ? 'Confirm Reject'
              : 'Reject'}
        </button>
        {decision === 'rejected' && (
          <button
            type="button"
            onClick={() => setDecision(null)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
