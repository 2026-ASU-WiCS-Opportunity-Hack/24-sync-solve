'use server'

import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createCheckoutSessionAction } from '@/features/payments/actions/createCheckoutSession'
import { eventRegistrationSchema, translateZodErrors } from '@/lib/utils/validation'
import type { ActionResult } from '@/types'

/**
 * Register for an event.
 *
 * Flow:
 * - Free event (ticket_price is NULL or 0): creates an event_registration with
 *   status=confirmed immediately and redirects to a success page.
 * - Paid event: delegates to createCheckoutSessionAction which redirects to Stripe.
 *   The webhook confirms the registration on payment success.
 */
export async function registerForEventAction(
  _prevState: ActionResult<{ url: string } | null> | null,
  formData: FormData
): Promise<ActionResult<{ url: string } | null>> {
  const raw = {
    event_id: formData.get('event_id') as string,
    guest_name: (formData.get('guest_name') as string) || '',
    guest_email: (formData.get('guest_email') as string) || '',
  }

  const result = eventRegistrationSchema.safeParse(raw)
  if (!result.success) {
    const tV = await getTranslations('validation')
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: translateZodErrors(result.error.flatten().fieldErrors, (k) => tV(k as never)),
    }
  }

  const { event_id, guest_name, guest_email } = result.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch event to check ticket_price and capacity
  const { data: event } = await supabase
    .from('events')
    .select(
      'id, title, ticket_price, max_attendees, is_published, chapter_id, chapter:chapters!events_chapter_id_fkey(slug, currency)'
    )
    .eq('id', event_id)
    .eq('is_published', true)
    .single()

  if (!event) {
    return { success: false, error: 'Event not found.' }
  }

  // Check capacity if max_attendees is set
  if (event.max_attendees) {
    const { count } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event_id)
      .in('status', ['pending', 'confirmed'])

    if ((count ?? 0) >= event.max_attendees) {
      return { success: false, error: 'This event is fully booked.' }
    }
  }

  // Check for duplicate registration (authenticated users only)
  if (user) {
    const { data: existing } = await supabase
      .from('event_registrations')
      .select('id, status')
      .eq('event_id', event_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'cancelled') {
        // Re-activate cancelled registration
        await createAdminClient()
          .from('event_registrations')
          .update({ status: 'confirmed', updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        redirect(`/events/${event_id}/register/success`)
      }
      return {
        success: false,
        error: 'You are already registered for this event.',
      }
    }
  }

  const ticketPrice = (event as typeof event & { ticket_price?: number | null }).ticket_price

  // ── Paid event — delegate to Stripe ─────────────────────────────────────────
  if (ticketPrice && ticketPrice > 0) {
    const chapterData = event.chapter as { slug: string; currency: string } | null
    const checkoutFormData = new FormData()
    checkoutFormData.set('payment_type', 'event_registration')
    checkoutFormData.set('event_id', event_id)
    if (chapterData?.slug) checkoutFormData.set('chapter_slug', chapterData.slug)
    // guest info stored in metadata for webhook
    if (!user && guest_email) checkoutFormData.set('guest_email', guest_email)
    if (!user && guest_name) checkoutFormData.set('guest_name', guest_name)

    return createCheckoutSessionAction(null, checkoutFormData)
  }

  // ── Free event — confirm immediately ────────────────────────────────────────
  const adminClient = createAdminClient()

  const insertData: {
    event_id: string
    status: 'confirmed'
    user_id?: string
    guest_name?: string
    guest_email?: string
  } = { event_id, status: 'confirmed' }

  if (user) {
    insertData.user_id = user.id
  } else {
    if (!guest_email) {
      return { success: false, error: 'Email is required to register.' }
    }
    insertData.guest_name = guest_name
    insertData.guest_email = guest_email
  }

  const { error } = await adminClient.from('event_registrations').insert(insertData)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'You are already registered for this event.' }
    }
    console.error('Event registration insert error:', error)
    return { success: false, error: 'Registration failed. Please try again.' }
  }

  redirect(`/events/${event_id}/register/success`)
}
