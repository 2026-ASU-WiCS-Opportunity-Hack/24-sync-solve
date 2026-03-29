'use client'

import { useActionState, useTransition } from 'react'
import Link from 'next/link'
import { Button, Input, Label } from '@heroui/react'
import { registerAction } from '@/features/auth/actions/register'
import type { ActionResult } from '@/types'

export function RegisterForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(registerAction, null)
  const [isPending, startTransition] = useTransition()

  return (
    <form
      action={(formData) => startTransition(() => formAction(formData))}
      noValidate
      aria-label="Create account"
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

      {/* Full Name */}
      <div className="flex flex-col gap-1">
        <Label id="full_name-label" htmlFor="full_name" isRequired>
          Full name
        </Label>
        <Input
          id="full_name"
          aria-labelledby="full_name-label"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          placeholder="Jane Doe"
          aria-invalid={
            !!(state && !state.success && state.fieldErrors?.['full_name']) || undefined
          }
        />
        {state && !state.success && state.fieldErrors?.['full_name'] && (
          <p className="text-xs text-red-600" role="alert">
            {state.fieldErrors['full_name'][0]}
          </p>
        )}
      </div>

      {/* Email */}
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
          aria-invalid={!!(state && !state.success && state.fieldErrors?.['email']) || undefined}
        />
        {state && !state.success && state.fieldErrors?.['email'] && (
          <p className="text-xs text-red-600" role="alert">
            {state.fieldErrors['email'][0]}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1">
        <Label id="password-label" htmlFor="password" isRequired>
          Password
        </Label>
        <Input
          id="password"
          aria-labelledby="password-label"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
          aria-invalid={!!(state && !state.success && state.fieldErrors?.['password']) || undefined}
        />
        {state && !state.success && state.fieldErrors?.['password'] && (
          <p className="text-xs text-red-600" role="alert">
            {state.fieldErrors['password'][0]}
          </p>
        )}
      </div>

      <Button
        type="submit"
        isDisabled={isPending}
        isPending={isPending}
        fullWidth
        className="bg-wial-navy hover:bg-wial-navy-dark mt-2 rounded-lg text-sm font-semibold text-white"
      >
        {isPending ? 'Creating account...' : 'Create Account'}
      </Button>

      <p className="text-center text-xs text-gray-400">
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

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-wial-red hover:text-wial-red-dark font-medium">
          Log in
        </Link>
      </p>
    </form>
  )
}
