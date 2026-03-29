'use server'

import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  translateZodErrors,
} from '@/lib/utils/validation'
import type { ActionResult } from '@/types'

export async function requestPasswordResetAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = { email: formData.get('email') as string }

  const result = forgotPasswordSchema.safeParse(raw)
  if (!result.success) {
    const tV = await getTranslations('validation')
    return {
      success: false,
      error: 'Please enter a valid email address.',
      fieldErrors: translateZodErrors(result.error.flatten().fieldErrors, (k) => tV(k as never)),
    }
  }

  const supabase = await createClient()
  const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { success: false, error: 'Failed to send reset email. Please try again.' }
  }

  return { success: true, data: null }
}

export async function updatePasswordAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    password: formData.get('password') as string,
    confirm_password: formData.get('confirm_password') as string,
  }

  const result = resetPasswordSchema.safeParse(raw)
  if (!result.success) {
    const tV = await getTranslations('validation')
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: translateZodErrors(result.error.flatten().fieldErrors, (k) => tV(k as never)),
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: result.data.password })

  if (error) {
    return { success: false, error: 'Failed to update password. Please try again.' }
  }

  return { success: true, data: null }
}
