'use client'

import { useActionState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button, Input, Label } from '@heroui/react'
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

      {/* New password */}
      <div className="flex flex-col gap-1">
        <Label id="password-label" htmlFor="password" isRequired>
          New password
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

      {/* Confirm password */}
      <div className="flex flex-col gap-1">
        <Label id="confirm_password-label" htmlFor="confirm_password" isRequired>
          Confirm new password
        </Label>
        <Input
          id="confirm_password"
          aria-labelledby="confirm_password-label"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Repeat your new password"
          aria-invalid={
            !!(state && !state.success && state.fieldErrors?.['confirm_password']) || undefined
          }
        />
        {state && !state.success && state.fieldErrors?.['confirm_password'] && (
          <p className="text-xs text-red-600" role="alert">
            {state.fieldErrors['confirm_password'][0]}
          </p>
        )}
      </div>

      <Button
        type="submit"
        isDisabled={isPending}
        isPending={isPending}
        fullWidth
        className="bg-wial-navy hover:bg-wial-navy-dark rounded-lg text-sm font-semibold text-white"
      >
        {isPending ? 'Updating password...' : 'Set New Password'}
      </Button>

      <p className="text-center text-sm text-gray-500">
        <Link href="/login" className="text-wial-red hover:text-wial-red-dark font-medium">
          ← Back to login
        </Link>
      </p>
    </form>
  )
}
