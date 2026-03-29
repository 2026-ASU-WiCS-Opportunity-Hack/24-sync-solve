'use client'

import { useActionState, useTransition } from 'react'
import Link from 'next/link'
import { Button, Input, Label } from '@heroui/react'
import { requestPasswordResetAction } from '@/features/auth/actions/resetPassword'
import type { ActionResult } from '@/types'

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    requestPasswordResetAction,
    null
  )
  const [isPending, startTransition] = useTransition()

  if (state?.success) {
    return (
      <div role="status" aria-live="polite" className="text-center">
        <div className="mb-4 flex justify-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-green-100 text-xl text-green-600">
            ✓
          </span>
        </div>
        <p className="font-medium text-gray-900">Check your email</p>
        <p className="mt-2 text-sm text-gray-500">
          We&apos;ve sent a password reset link to your email address.
        </p>
        <Link
          href="/login"
          className="text-wial-red hover:text-wial-red-dark mt-4 inline-block text-sm font-medium"
        >
          ← Back to login
        </Link>
      </div>
    )
  }

  return (
    <form
      action={(formData) => startTransition(() => formAction(formData))}
      noValidate
      aria-label="Reset password"
      className="space-y-4"
    >
      {state && !state.success && state.error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Label id="email-label" htmlFor="email" isRequired>
          Email address
        </Label>
        <Input
          id="email"
          aria-labelledby="email-label"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </div>

      <Button
        type="submit"
        isDisabled={isPending}
        isPending={isPending}
        fullWidth
        className="bg-wial-navy hover:bg-wial-navy-dark rounded-lg text-sm font-semibold text-white"
      >
        {isPending ? 'Sending...' : 'Send Reset Link'}
      </Button>

      <p className="text-center text-sm text-gray-500">
        <Link href="/login" className="text-wial-red hover:text-wial-red-dark font-medium">
          ← Back to login
        </Link>
      </p>
    </form>
  )
}
