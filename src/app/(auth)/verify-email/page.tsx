'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Mail, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@heroui/react'
import { resendVerificationAction } from '@/features/auth/actions/resendVerification'
import type { ActionResult } from '@/types'

export default function VerifyEmailPage() {
  const t = useTranslations('auth.verifyEmail')

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    resendVerificationAction,
    null
  )

  const didResend = state?.success === true

  return (
    <div className="text-center">
      {/* Icon */}
      <div
        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50"
        aria-hidden="true"
      >
        <Mail className="text-wial-navy h-8 w-8" />
      </div>

      {/* Heading */}
      <h1 className="text-wial-navy text-2xl font-bold">{t('title')}</h1>
      <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
      <p className="mt-4 text-sm leading-relaxed text-gray-600">{t('body')}</p>

      {/* Success feedback */}
      {didResend && (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          <CheckCircle size={16} aria-hidden="true" />
          {t('resentSuccess')}
        </div>
      )}

      {/* Error feedback */}
      {state && !state.success && (
        <div
          role="alert"
          aria-live="polite"
          className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      {/* Resend form */}
      <form action={formAction} className="mt-6">
        <Button
          type="submit"
          isDisabled={isPending || didResend}
          isPending={isPending}
          className="bg-wial-navy hover:bg-wial-navy-dark rounded-lg px-5 text-sm font-semibold text-white"
        >
          {isPending ? t('resending') : t('resendButton')}
        </Button>
      </form>

      {/* Already verified hint */}
      <p className="mt-4 text-xs text-gray-400">{t('alreadyVerified')}</p>

      {/* Back to login */}
      <p className="mt-6 text-sm text-gray-500">
        <Link href="/login" className="text-wial-navy font-medium hover:underline">
          {t('backToLogin')}
        </Link>
      </p>
    </div>
  )
}
