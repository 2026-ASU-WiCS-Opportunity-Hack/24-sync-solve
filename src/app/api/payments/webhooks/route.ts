import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { constructStripeEvent } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

/**
 * Stripe webhook handler.
 *
 * Security:
 * - Reads raw body for signature verification (never trust parsed body)
 * - Verifies Stripe-Signature header with STRIPE_WEBHOOK_SECRET
 * - Uses service-role Supabase client (bypasses RLS) for writing payment records
 * - Auth middleware is intentionally skipped for this route (see src/middleware.ts)
 */
export async function POST(request: NextRequest) {
  // ── Read raw body (required for Stripe signature verification) ─────────────────
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe-Signature header' }, { status: 400 })
  }

  // ── Verify webhook signature ───────────────────────────────────────────────────
  let event: Stripe.Event
  try {
    event = constructStripeEvent(payload, signature)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  // ── Handle events ──────────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      default:
        // Unhandled event — acknowledge receipt without processing
        break
    }
  } catch (err) {
    console.error(`Stripe webhook handler error for ${event.type}:`, err)
    // Return 500 so Stripe retries the webhook
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}

// ── Event Handlers ──────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const adminClient = createAdminClient()

  const userId = session.metadata?.['user_id']
  const paymentType = session.metadata?.['payment_type']
  const chapterId = session.metadata?.['chapter_id'] || null

  if (!userId || !paymentType) {
    throw new Error(`Missing required metadata in session ${session.id}`)
  }

  // Idempotency: check if payment already recorded
  const { data: existing } = await adminClient
    .from('payments')
    .select('id')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle()

  if (existing) {
    // Already processed — idempotent, return success
    return
  }

  // Retrieve the payment intent for receipt URL
  let receiptUrl: string | null = null
  if (session.payment_intent && typeof session.payment_intent === 'string') {
    try {
      const { createStripeClient } = await import('@/lib/stripe/client')
      const stripe = createStripeClient()
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent, {
        expand: ['latest_charge'],
      })
      const charge = paymentIntent.latest_charge as Stripe.Charge | null
      receiptUrl = charge?.receipt_url ?? null
    } catch {
      // Non-critical — proceed without receipt URL
    }
  }

  const { error } = await adminClient.from('payments').insert({
    user_id: userId,
    chapter_id: chapterId || undefined,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === 'string' ? session.payment_intent : null,
    amount: session.amount_total ?? 0,
    currency: (session.currency ?? 'usd').toUpperCase(),
    payment_type: paymentType as
      | 'enrollment_fee'
      | 'certification_fee'
      | 'membership_dues'
      | 'event_registration',
    status: 'succeeded',
    receipt_url: receiptUrl,
  })

  if (error) {
    throw new Error(`Failed to insert payment record: ${error.message}`)
  }

  // ── Update membership status on dues payment ─────────────────────────────────
  if (paymentType === 'membership_dues') {
    const membershipExpiresAt = new Date()
    membershipExpiresAt.setFullYear(membershipExpiresAt.getFullYear() + 1)

    await adminClient
      .from('profiles')
      .update({
        membership_status: 'active',
        membership_expires_at: membershipExpiresAt.toISOString(),
      })
      .eq('id', userId)
  }

  // ── Confirm event registration on successful payment ──────────────────────────
  if (paymentType === 'event_registration') {
    const eventId = session.metadata?.['event_id'] || null
    const guestEmail = session.metadata?.['guest_email'] || null
    const guestName = session.metadata?.['guest_name'] || null

    if (eventId) {
      // Fetch the newly created payment record
      const { data: paymentRecord } = await adminClient
        .from('payments')
        .select('id')
        .eq('stripe_checkout_session_id', session.id)
        .maybeSingle()

      const registrationData: {
        event_id: string
        status: 'confirmed'
        payment_id: string | null
        user_id?: string
        guest_name?: string
        guest_email?: string
      } = {
        event_id: eventId,
        status: 'confirmed',
        payment_id: paymentRecord?.id ?? null,
      }

      if (userId) {
        registrationData.user_id = userId
      } else if (guestEmail) {
        registrationData.guest_email = guestEmail
        if (guestName) registrationData.guest_name = guestName
      }

      await adminClient.from('event_registrations').upsert(registrationData, {
        onConflict: 'event_id,user_id',
        ignoreDuplicates: false,
      })
    }
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const adminClient = createAdminClient()

  // Update any pending payment records to failed
  await adminClient
    .from('payments')
    .update({ status: 'failed' })
    .eq('stripe_checkout_session_id', session.id)
    .eq('status', 'pending')
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const adminClient = createAdminClient()

  if (!charge.payment_intent || typeof charge.payment_intent !== 'string') return

  await adminClient
    .from('payments')
    .update({ status: 'refunded' })
    .eq('stripe_payment_intent_id', charge.payment_intent)
    .eq('status', 'succeeded')
}
