'use client'

import { useActionState, useTransition } from 'react'
import Link from 'next/link'
import { registerAction } from '@/features/auth/actions/register'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false, error: '' }

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState)
  const [isPending, startTransition] = useTransition()

  return (
    <form
      action={(formData) => startTransition(() => formAction(formData))}
      noValidate
      aria-label="Create account"
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

      {/* Full Name */}
      <div className="mb-4">
        <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-gray-700">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          placeholder="Jane Doe"
          aria-invalid={!state.success && state.fieldErrors?.['full_name'] ? 'true' : undefined}
          aria-describedby={
            !state.success && state.fieldErrors?.['full_name'] ? 'name-error' : undefined
          }
          className="focus:border-wial-navy focus:ring-wial-navy/20 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none"
        />
        {!state.success && state.fieldErrors?.['full_name'] && (
          <p id="name-error" className="mt-1 text-xs text-red-600">
            {state.fieldErrors['full_name']?.[0]}
          </p>
        )}
      </div>

      {/* Email */}
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
          aria-invalid={!state.success && state.fieldErrors?.['email'] ? 'true' : undefined}
          aria-describedby={
            !state.success && state.fieldErrors?.['email'] ? 'email-error' : undefined
          }
          className="focus:border-wial-navy focus:ring-wial-navy/20 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none"
        />
        {!state.success && state.fieldErrors?.['email'] && (
          <p id="email-error" className="mt-1 text-xs text-red-600">
            {state.fieldErrors['email']?.[0]}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="mb-2">
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
          aria-invalid={!state.success && state.fieldErrors?.['password'] ? 'true' : undefined}
          aria-describedby={
            !state.success && state.fieldErrors?.['password'] ? 'password-error' : undefined
          }
          className="focus:border-wial-navy focus:ring-wial-navy/20 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none"
        />
        {!state.success && state.fieldErrors?.['password'] && (
          <p id="password-error" className="mt-1 text-xs text-red-600">
            {state.fieldErrors['password']?.[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-wial-navy hover:bg-wial-navy-dark focus:ring-wial-navy mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        aria-busy={isPending}
      >
        {isPending ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="mt-4 text-center text-xs text-gray-400">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-gray-600">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-gray-600">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-wial-red hover:text-wial-red-dark font-medium">
          Log in
        </Link>
      </p>
    </form>
  )
}
