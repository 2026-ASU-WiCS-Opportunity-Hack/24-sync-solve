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
  amount_override: z.number().int().positive().optional(), // For variable membership dues
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
})

export async function createCheckoutSessionAction(
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
    amount_override: formData.get('amount_override')
      ? Number(formData.get('amount_override'))
      : undefined,
  }

  const result = checkoutSchema.safeParse(raw)
  if (!result.success) {
    return { success: false, error: 'Invalid payment request.' }
  }

  const { payment_type, chapter_slug } = result.data

  // ── Determine amount (server-side only — never trust client amount) ────────────
  let amount: number
  let currency = 'USD'

  if (payment_type === 'membership_dues' && result.data.amount_override) {
    amount = result.data.amount_override
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
  const stripe = createStripeClient()
  const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000'

  const successUrl = chapter_slug
    ? `${siteUrl}/${chapter_slug}/pay?success=true`
    : `${siteUrl}/payment/success`
  const cancelUrl = chapter_slug
    ? `${siteUrl}/${chapter_slug}/pay?cancelled=true`
    : `${siteUrl}/payment/cancelled`

  const paymentTypeLabels: Record<string, string> = {
    enrollment_fee: 'WIAL Enrollment Fee',
    certification_fee: 'WIAL Certification Fee',
    membership_dues: 'WIAL Membership Dues',
    event_registration: 'WIAL Event Registration',
  }

  let session
  try {
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
      },
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
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
