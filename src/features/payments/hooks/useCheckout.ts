'use client'

import { useState, useTransition } from 'react'
import { createCheckoutSessionAction } from '@/features/payments/actions/createCheckoutSession'
import type { PaymentType } from '@/features/payments/types'

interface UseCheckoutOptions {
  chapterId: string
  onError?: (error: string) => void
}

/**
 * Handles the client-side checkout initiation flow.
 * Calls the server action, then redirects to the Stripe Checkout URL.
 */
export function useCheckout({ chapterId, onError }: UseCheckoutOptions) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function startCheckout(paymentType: PaymentType) {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('payment_type', paymentType)
      formData.set('chapter_id', chapterId)
      const result = await createCheckoutSessionAction(null, formData)
      if (!result.success) {
        const msg = result.error ?? 'Checkout failed. Please try again.'
        setError(msg)
        onError?.(msg)
        return
      }
      // Redirect to Stripe Checkout hosted page
      window.location.href = result.data.url
    })
  }

  return { startCheckout, isPending, error }
}
