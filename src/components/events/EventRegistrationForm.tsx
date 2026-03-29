'use client'

import { useActionState, useTransition } from 'react'
import { Button, Input, Label } from '@heroui/react'
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

      <div className="flex flex-col gap-1">
        <Label id="reg-name-label" htmlFor="reg-name">
          Full Name
        </Label>
        <p className="text-xs text-gray-500">
          Used for your registration confirmation. Leave blank if logged in.
        </p>
        <Input
          id="reg-name"
          aria-labelledby="reg-name-label"
          name="guest_name"
          type="text"
          autoComplete="name"
          placeholder="Jane Doe"
          aria-invalid={
            !!(state && !state.success && state.fieldErrors?.['guest_name']) || undefined
          }
        />
        {state && !state.success && state.fieldErrors?.['guest_name'] && (
          <p className="text-xs text-red-600" role="alert">
            {state.fieldErrors['guest_name'][0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label id="reg-email-label" htmlFor="reg-email">
          Email Address
        </Label>
        <p className="text-xs text-gray-500">
          Required if you are not logged in. We'll send your confirmation here.
        </p>
        <Input
          id="reg-email"
          aria-labelledby="reg-email-label"
          name="guest_email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={
            !!(state && !state.success && state.fieldErrors?.['guest_email']) || undefined
          }
        />
        {state && !state.success && state.fieldErrors?.['guest_email'] && (
          <p className="text-xs text-red-600" role="alert">
            {state.fieldErrors['guest_email'][0]}
          </p>
        )}
      </div>

      <Button
        type="submit"
        isDisabled={isPending}
        isPending={isPending}
        fullWidth
        className="bg-wial-navy hover:bg-wial-navy-light rounded-xl px-6 text-sm font-semibold text-white shadow-sm"
      >
        {isPending
          ? isFree
            ? 'Registering…'
            : 'Redirecting to payment…'
          : isFree
            ? 'Confirm Free Registration'
            : 'Continue to Payment'}
      </Button>

      {!isFree && (
        <p className="text-center text-xs text-gray-500">
          You will be redirected to Stripe for secure payment processing.
        </p>
      )}
    </form>
  )
}
