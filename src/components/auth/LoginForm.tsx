'use client'

import { useActionState, useTransition } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button, Input, Label } from '@heroui/react'
import { loginAction } from '@/features/auth/actions/login'
import type { ActionResult } from '@/types'

export function LoginForm() {
  const t = useTranslations('auth.login')
  const [state, formAction] = useActionState<ActionResult | null, FormData>(loginAction, null)
  const [isPending, startTransition] = useTransition()

  return (
    <form
      action={(formData) => startTransition(() => formAction(formData))}
      noValidate
      aria-label={t('title')}
      className="space-y-4"
    >
      {/* Global error */}
      {state && !state.success && state.error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1">
        <Label id="email-label" htmlFor="email" isRequired>
          {t('emailLabel')}
        </Label>
        <Input
          id="email"
          aria-labelledby="email-label"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t('emailPlaceholder')}
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
        <div className="mb-1.5 flex items-center justify-between">
          <Label id="password-label" htmlFor="password">
            {t('passwordLabel')}
          </Label>
          <Link href="/forgot-password" className="text-wial-red hover:text-wial-red-dark text-xs">
            {t('forgotPassword')}
          </Link>
        </div>
        <Input
          id="password"
          aria-labelledby="password-label"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder={t('passwordPlaceholder')}
          aria-invalid={!!(state && !state.success && state.fieldErrors?.['password']) || undefined}
        />
        {state && !state.success && state.fieldErrors?.['password'] && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {state.fieldErrors['password'][0]}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        isDisabled={isPending}
        isPending={isPending}
        fullWidth
        className="bg-wial-navy hover:bg-wial-navy-dark mt-2 rounded-lg text-sm font-semibold text-white"
      >
        {isPending ? t('submitting') : t('submitButton')}
      </Button>

      {/* Sign up link */}
      <p className="text-center text-sm text-gray-500">
        {t('noAccount')}{' '}
        <Link href="/register" className="text-wial-red hover:text-wial-red-dark font-medium">
          {t('signUpLink')}
        </Link>
      </p>
    </form>
  )
}
