/**
 * Payment feature types.
 * Re-exports domain types from @/types and defines payment-specific shapes.
 */

import type { Payment } from '@/types'
import type { PaymentType, PaymentStatus } from '@/types/database'

export type { Payment, PaymentType, PaymentStatus }

/** Input to create a Stripe Checkout session */
export interface CheckoutSessionInput {
  paymentType: PaymentType
  chapterId: string
  /** Optional custom amount in cents (admin use only — otherwise derived from paymentType) */
  customAmount?: number
}

/** Result of creating a Stripe Checkout session */
export interface CheckoutSessionResult {
  url: string
}

/** Payment record with chapter slug joined (for display in admin) */
export interface PaymentWithChapter extends Payment {
  chapter: { slug: string; name: string } | null
}
