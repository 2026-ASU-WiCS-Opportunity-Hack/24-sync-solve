'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useActionState } from 'react'
import { createCheckoutSessionAction } from '@/features/payments/actions/createCheckoutSession'
import { PAYMENT_AMOUNTS } from '@/lib/stripe/config'
import { formatCurrency } from '@/lib/utils/format'
import { CreditCard, CheckCircle, XCircle, Lock } from 'lucide-react'
import type { ActionResult } from '@/types'

interface PaymentOptionProps {
  title: string
  description: string
  amount: number
  currency: string
  paymentType: string
  chapterSlug: string
  accentColor: string
}

function PaymentOption({
  title,
  description,
  amount,
  currency,
  paymentType,
  chapterSlug,
  accentColor,
}: PaymentOptionProps) {
  const t = useTranslations('payments')
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ url: string }> | null,
    FormData
  >(createCheckoutSessionAction, null)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-wial-navy text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
        <div
          className="shrink-0 text-2xl font-extrabold"
          style={{ color: accentColor }}
          aria-label={`Amount: ${formatCurrency(amount, currency)}`}
        >
          {formatCurrency(amount, currency)}
        </div>
      </div>

      {state && !state.success && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}

      <form action={formAction} className="mt-4">
        <input type="hidden" name="payment_type" value={paymentType} />
        <input type="hidden" name="chapter_slug" value={chapterSlug} />

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: accentColor }}
          aria-label={`${t('checkout.proceedToPayment')} — ${title}`}
        >
          <CreditCard size={16} aria-hidden="true" />
          {isPending ? t('checkout.processing') : t('checkout.proceedToPayment')}
        </button>
      </form>
    </div>
  )
}

export interface PaymentPageProps {
  chapterSlug: string
  chapterName: string
  accentColor: string
  currency: string
}

export function PaymentPage({ chapterSlug, chapterName, accentColor, currency }: PaymentPageProps) {
  const t = useTranslations('payments')
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'
  const isCancelled = searchParams.get('cancelled') === 'true'

  const paymentOptions = [
    {
      paymentType: 'enrollment_fee',
      title: t('types.enrollment_fee'),
      description:
        'One-time enrollment fee for new Action Learning program participants in this chapter.',
      amount: PAYMENT_AMOUNTS.ENROLLMENT_FEE,
    },
    {
      paymentType: 'certification_fee',
      title: t('types.certification_fee'),
      description:
        'Fee for WIAL coach certification assessment and official certification processing.',
      amount: PAYMENT_AMOUNTS.CERTIFICATION_FEE,
    },
  ]

  return (
    <>
      {/* Page header */}
      <section className="py-12 text-center text-white" style={{ backgroundColor: accentColor }}>
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-4 text-white/80">
            {chapterName} — {t('subtitle')}
          </p>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          {/* Success / cancel alerts */}
          {isSuccess && (
            <div
              role="status"
              aria-live="polite"
              className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
            >
              <CheckCircle size={18} className="shrink-0 text-green-600" aria-hidden="true" />
              {t('checkout.successMessage')}
            </div>
          )}
          {isCancelled && (
            <div
              role="status"
              aria-live="polite"
              className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
            >
              <XCircle size={18} className="shrink-0 text-amber-600" aria-hidden="true" />
              {t('checkout.cancelMessage')}
            </div>
          )}

          {/* Payment options */}
          <div className="space-y-4">
            {paymentOptions.map((option) => (
              <PaymentOption
                key={option.paymentType}
                {...option}
                currency={currency}
                chapterSlug={chapterSlug}
                accentColor={accentColor}
              />
            ))}
          </div>

          {/* Security note */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Lock size={12} aria-hidden="true" />
            <span>{t('checkout.secureNote')}</span>
          </div>
        </div>
      </section>
    </>
  )
}
