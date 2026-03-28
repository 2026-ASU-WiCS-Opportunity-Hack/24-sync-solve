/**
 * Payment configuration constants.
 * Amounts in cents (Stripe standard).
 */
export const PAYMENT_AMOUNTS = {
  ENROLLMENT_FEE: 5000, // $50.00
  CERTIFICATION_FEE: 3000, // $30.00
  // Membership dues are variable per chapter — fetched from chapter settings
} as const

export const STRIPE_CURRENCY = 'usd' as const

export const PAYMENT_TYPE_LABELS = {
  enrollment_fee: 'Enrollment Fee',
  certification_fee: 'Certification Fee',
  membership_dues: 'Membership Dues',
  event_registration: 'Event Registration',
} as const
