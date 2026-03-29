'use client'

import { useActionState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { registerForEventAction } from '@/features/events/actions/registerForEvent'
import type { ActionResult } from '@/types'

interface EventRegistrationFormProps {
  eventId: string
  isFree: boolean
}

export function EventRegistrationForm({ eventId, isFree }: EventRegistrationFormProps) {
  const [, startTransition] = useTransition()
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ url: string } | null> | null,
    FormData
  >(registerForEventAction, null)

  return (
    <form action={(fd) => startTransition(() => formAction(fd))} className="space-y-5" noValidate>
      <input type="hidden" name="event_id" value={eventId} />

      {/* Error banner */}
      {state && !state.success && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.error}
        </div>
      )}

      {/* Guest info — only shown for unauthenticated flow hint */}
      <div>
        <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          id="reg-name"
          name="guest_name"
          type="text"
          autoComplete="name"
          className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          placeholder="Jane Doe"
        />
        <p className="mt-1 text-xs text-gray-500">
          Used for your registration confirmation. Leave blank if logged in.
        </p>
        {state && !state.success && state.fieldErrors?.['guest_name'] && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors['guest_name'][0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          id="reg-email"
          name="guest_email"
          type="email"
          autoComplete="email"
          className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          placeholder="you@example.com"
        />
        <p className="mt-1 text-xs text-gray-500">
          Required if you are not logged in. We&apos;ll send your confirmation here.
        </p>
        {state && !state.success && state.fieldErrors?.['guest_email'] && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors['guest_email'][0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-wial-navy hover:bg-wial-navy-light inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
        {isPending
          ? isFree
            ? 'Registering…'
            : 'Redirecting to payment…'
          : isFree
            ? 'Confirm Free Registration'
            : 'Continue to Payment'}
      </button>

      {!isFree && (
        <p className="text-center text-xs text-gray-500">
          You will be redirected to Stripe for secure payment processing.
        </p>
      )}
    </form>
  )
}
