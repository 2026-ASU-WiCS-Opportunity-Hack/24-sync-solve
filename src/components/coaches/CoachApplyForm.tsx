'use client'

import { useActionState } from 'react'
import { applyForCoachAction } from '@/features/coaches/actions/coachApplication'
import type { ActionResult, CoachApplication } from '@/types'

interface Chapter {
  id: string
  name: string
  slug: string
}

interface CoachApplyFormProps {
  chapters: Chapter[]
}

export function CoachApplyForm({ chapters }: CoachApplyFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionResult<CoachApplication> | null,
    FormData
  >(applyForCoachAction, null)

  if (state?.success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="font-semibold text-green-800">Application submitted!</p>
        <p className="mt-1 text-sm text-green-700">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Chapter */}
      <div>
        <label htmlFor="chapter_id" className="block text-sm font-medium text-gray-700">
          Chapter{' '}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        </label>
        <select
          id="chapter_id"
          name="chapter_id"
          required
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Select a chapter…</option>
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.name}
            </option>
          ))}
        </select>
        {state?.fieldErrors?.['chapter_id'] && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {state.fieldErrors['chapter_id'][0]}
          </p>
        )}
      </div>

      {/* Credly URL */}
      <div>
        <label htmlFor="credly_url" className="block text-sm font-medium text-gray-700">
          Credly Badge URL{' '}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        </label>
        <p className="mt-0.5 text-xs text-gray-500">
          Your Credly badge URL from <span className="font-medium">credly.com/badges/…</span>
        </p>
        <input
          id="credly_url"
          name="credly_url"
          type="url"
          required
          placeholder="https://www.credly.com/badges/…"
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        {state?.fieldErrors?.['credly_url'] && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {state.fieldErrors['credly_url'][0]}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={2000}
          placeholder="Tell us about your Action Learning coaching experience…"
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Global error */}
      {state && !state.success && !state.fieldErrors && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      )}
      {state && !state.success && state.fieldErrors && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-wial-navy hover:bg-wial-navy-dark w-full rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
      >
        {isPending ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  )
}
