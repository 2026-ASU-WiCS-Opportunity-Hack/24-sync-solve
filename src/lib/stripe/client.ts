import Stripe from 'stripe'

/**
 * Server-side Stripe client (secret key).
 * Use only in Server Actions and API Route handlers.
 * NEVER import in Client Components.
 */
export function createStripeClient(): Stripe {
  const secretKey = process.env['STRIPE_SECRET_KEY']

  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable')
  }

  return new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  })
}

/**
 * Verify Stripe webhook signature.
 * Returns the verified event or throws on invalid signature.
 */
export function constructStripeEvent(payload: string | Buffer, signature: string): Stripe.Event {
  const stripe = createStripeClient()
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']

  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable')
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
