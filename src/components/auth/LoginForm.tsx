'use client'

import { useActionState, useTransition } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
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
    >
      {/* Global error */}
      {state && !state.success && state.error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      {/* Email */}
      <div className="mb-4">
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
          {t('emailLabel')}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t('emailPlaceholder')}
          aria-invalid={
            state && !state.success && state.fieldErrors?.['email'] ? 'true' : undefined
          }
          aria-describedby={
            state && !state.success && state.fieldErrors?.['email'] ? 'email-error' : undefined
          }
          className="focus:border-wial-navy focus:ring-wial-navy/20 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none"
        />
        {state && !state.success && state.fieldErrors?.['email'] && (
          <p id="email-error" className="mt-1 text-xs text-red-600">
            {state.fieldErrors['email']?.[0]}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="mb-2">
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            {t('passwordLabel')}
          </label>
          <Link href="/forgot-password" className="text-wial-red hover:text-wial-red-dark text-xs">
            {t('forgotPassword')}
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder={t('passwordPlaceholder')}
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

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="bg-wial-navy hover:bg-wial-navy-dark focus:ring-wial-navy mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        aria-busy={isPending}
      >
        {isPending ? t('submitting') : t('submitButton')}
      </button>

      {/* Sign up link */}
      <p className="mt-4 text-center text-sm text-gray-500">
        {t('noAccount')}{' '}
        <Link href="/register" className="text-wial-red hover:text-wial-red-dark font-medium">
          {t('signUpLink')}
        </Link>
      </p>
    </form>
  )
}
