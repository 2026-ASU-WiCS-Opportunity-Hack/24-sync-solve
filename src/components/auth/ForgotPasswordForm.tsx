'use client'

import { useActionState, useTransition } from 'react'
import Link from 'next/link'
import { requestPasswordResetAction } from '@/features/auth/actions/resetPassword'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false, error: '' }

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialState)
  const [isPending, startTransition] = useTransition()

  if (state.success) {
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
    >
      {!state.success && state.error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="focus:border-wial-navy focus:ring-wial-navy/20 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-wial-navy hover:bg-wial-navy-dark focus:ring-wial-navy w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        aria-busy={isPending}
      >
        {isPending ? 'Sending...' : 'Send Reset Link'}
      </button>

      <p className="mt-4 text-center text-sm text-gray-500">
        <Link href="/login" className="text-wial-red hover:text-wial-red-dark font-medium">
          ← Back to login
        </Link>
      </p>
    </form>
  )
}
