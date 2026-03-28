'use client'

import { useActionState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { updatePasswordAction } from '@/features/auth/actions/resetPassword'
import type { ActionResult } from '@/types'

export function ResetPasswordForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    updatePasswordAction,
    null
  )
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    if (state?.success) {
      router.push('/login?password_updated=true')
    }
  }, [state, router])

  return (
    <form
      action={(formData) => startTransition(() => formAction(formData))}
      noValidate
      aria-label="Set new password"
    >
      {state && !state.success && state.error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      {/* New password */}
      <div className="mb-4">
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
          aria-invalid={
            state && !state.success && state.fieldErrors?.['password'] ? 'true' : undefined
          }
          aria-describedby={
            state && !state.success && state.fieldErrors?.['password']
              ? 'password-error'
              : undefined
          }
          className="focus:border-wial-navy focus:ring-wial-navy/20 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none"
        />
        {state && !state.success && state.fieldErrors?.['password'] && (
          <p id="password-error" className="mt-1 text-xs text-red-600">
            {state.fieldErrors['password']?.[0]}
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div className="mb-6">
        <label
          htmlFor="confirm_password"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Confirm new password
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Repeat your new password"
          aria-invalid={
            state && !state.success && state.fieldErrors?.['confirm_password'] ? 'true' : undefined
          }
          aria-describedby={
            state && !state.success && state.fieldErrors?.['confirm_password']
              ? 'confirm-password-error'
              : undefined
          }
          className="focus:border-wial-navy focus:ring-wial-navy/20 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none"
        />
        {state && !state.success && state.fieldErrors?.['confirm_password'] && (
          <p id="confirm-password-error" className="mt-1 text-xs text-red-600">
            {state.fieldErrors['confirm_password']?.[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-wial-navy hover:bg-wial-navy-dark focus:ring-wial-navy w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        aria-busy={isPending}
      >
        {isPending ? 'Updating password...' : 'Set New Password'}
      </button>

      <p className="mt-4 text-center text-sm text-gray-500">
        <Link href="/login" className="text-wial-red hover:text-wial-red-dark font-medium">
          ← Back to login
        </Link>
      </p>
    </form>
  )
}
