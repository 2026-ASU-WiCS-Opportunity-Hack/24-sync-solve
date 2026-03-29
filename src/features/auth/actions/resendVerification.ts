'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

/**
 * Resend the Supabase email-verification link to the currently signed-in user.
 *
 * Intended for users who signed up but have not yet confirmed their email
 * address. The user must be authenticated (session exists) to call this action.
 */
export async function resendVerificationAction(
  _prevState: ActionResult | null,
  _formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'You must be logged in to request a verification email.' }
  }

  if (user.email_confirmed_at) {
    return { success: false, error: 'Your email address is already verified.' }
  }

  if (!user.email) {
    return { success: false, error: 'No email address is associated with your account.' }
  }

  const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: user.email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    console.error('[resendVerification] Supabase resend error:', error)
    return { success: false, error: 'Failed to send verification email. Please try again.' }
  }

  return { success: true, data: null, message: 'Verification email sent! Check your inbox.' }
}
