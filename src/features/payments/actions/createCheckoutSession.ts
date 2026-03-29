'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createStripeClient } from '@/lib/stripe/client'
import { PAYMENT_AMOUNTS } from '@/lib/stripe/config'
import type { ActionResult, PaymentType } from '@/types'

const checkoutSchema = z.object({
  payment_type: z.enum([
    'enrollment_fee',
    'certification_fee',
    'membership_dues',
    'event_registration',
  ]),
  chapter_slug: z.string().optional(),
  event_id: z.string().uuid().optional(), // Required for event_registration
  amount_override: z.number().int().positive().optional(), // For variable membership dues
  guest_email: z.string().email().optional(), // For unauthenticated event registration
  guest_name: z.string().max(100).optional(), // For unauthenticated event registration
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
})

export async function createCheckoutSessionAction(
  _prevState: ActionResult<{ url: string }> | null,
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  // ── Auth check ───────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'You must be logged in to make a payment.' }
  }

  // ── Validate input ────────────────────────────────────────────────────────────
  const raw = {
    payment_type: formData.get('payment_type') as string,
    chapter_slug: formData.get('chapter_slug') as string | undefined,
    event_id: (formData.get('event_id') as string | null) ?? undefined,
    amount_override: formData.get('amount_override')
      ? Number(formData.get('amount_override'))
      : undefined,
    guest_email: (formData.get('guest_email') as string | null) ?? undefined,
    guest_name: (formData.get('guest_name') as string | null) ?? undefined,
  }

  const result = checkoutSchema.safeParse(raw)
  if (!result.success) {
    return { success: false, error: 'Invalid payment request.' }
  }

  const { payment_type, chapter_slug, event_id, guest_email, guest_name } = result.data

  // ── Determine amount (server-side only — never trust client amount) ────────────
  let amount: number
  let currency = 'USD'

  if (payment_type === 'membership_dues' && result.data.amount_override) {
    amount = result.data.amount_override
  } else if (payment_type === 'event_registration') {
    // Must look up the event's ticket_price — client cannot supply amount
    if (!event_id) {
      return { success: false, error: 'Event ID is required for event registration.' }
    }
    const { data: eventRow } = await supabase
      .from('events')
      .select('ticket_price')
      .eq('id', event_id)
      .eq('is_published', true)
      .single()

    const ticketPrice = (eventRow as typeof eventRow & { ticket_price?: number | null })
      ?.ticket_price
    if (!ticketPrice || ticketPrice <= 0) {
      return { success: false, error: 'This event does not have a ticket price set.' }
    }
    amount = ticketPrice
  } else {
    const amounts: Record<string, number | undefined> = {
      enrollment_fee: PAYMENT_AMOUNTS.ENROLLMENT_FEE,
      certification_fee: PAYMENT_AMOUNTS.CERTIFICATION_FEE,
    }
    amount = amounts[payment_type] ?? 0
  }

  if (amount <= 0) {
    return { success: false, error: 'Invalid payment amount.' }
  }

  // ── Resolve chapter ───────────────────────────────────────────────────────────
  let chapterId: string | null = null
  if (chapter_slug) {
    const { data: chapter } = await supabase
      .from('chapters')
      .select('id, currency')
      .eq('slug', chapter_slug)
      .single()

    if (chapter) {
      chapterId = chapter.id
      currency = chapter.currency ?? 'USD'
    }
  }

  // ── Get user profile ──────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  // ── Create Stripe Checkout Session ───────────────────────────────────────────
  const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000'

  let successUrl: string
  let cancelUrl: string

  if (payment_type === 'event_registration' && event_id) {
    successUrl = `${siteUrl}/events/${event_id}/register/success?session_id={CHECKOUT_SESSION_ID}`
    cancelUrl = `${siteUrl}/events/${event_id}`
  } else if (chapter_slug) {
    successUrl = `${siteUrl}/${chapter_slug}/pay?success=true&session_id={CHECKOUT_SESSION_ID}`
    cancelUrl = `${siteUrl}/${chapter_slug}/pay?cancelled=true`
  } else {
    successUrl = `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`
    cancelUrl = `${siteUrl}/payment/cancelled`
  }

  const paymentTypeLabels: Record<string, string> = {
    enrollment_fee: 'WIAL Enrollment Fee',
    certification_fee: 'WIAL Certification Fee',
    membership_dues: 'WIAL Membership Dues',
    event_registration: 'WIAL Event Registration',
  }

  // createStripeClient() throws if STRIPE_SECRET_KEY is not set.
  // Keep it inside the try-catch so missing config surfaces as a
  // user-visible error message rather than an unhandled 500.
  let session
  try {
    const stripe = createStripeClient()
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: profile?.email ?? user.email,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: amount,
            product_data: {
              name: paymentTypeLabels[payment_type] ?? payment_type,
              description: chapter_slug ? `${chapter_slug.toUpperCase()} Chapter` : 'WIAL Global',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        payment_type,
        chapter_id: chapterId ?? '',
        event_id: event_id ?? '',
        guest_email: guest_email ?? '',
        guest_name: guest_name ?? '',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })
  } catch (err) {
    console.error('Stripe checkout session creation failed:', err)
    return { success: false, error: 'Payment processing unavailable. Please try again.' }
  }

  if (!session.url) {
    return { success: false, error: 'Failed to create payment session.' }
  }

  redirect(session.url)
}
