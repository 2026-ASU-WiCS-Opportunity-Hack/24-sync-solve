'use server'

import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, translateZodErrors } from '@/lib/utils/validation'
import type { ActionResult } from '@/types'

export async function loginAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const result = loginSchema.safeParse(raw)
  if (!result.success) {
    const tV = await getTranslations('validation')
    return {
      success: false,
      error: 'Invalid input.',
      fieldErrors: translateZodErrors(result.error.flatten().fieldErrors, (k) => tV(k as never)),
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(result.data)

  if (error) {
    return {
      success: false,
      error:
        error.message === 'Invalid login credentials'
          ? 'Invalid email or password.'
          : 'Something went wrong. Please try again.',
    }
  }

  redirect('/')
}

export async function loginWithGoogleAction(): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()
  const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error || !data.url) {
    return { success: false, error: 'Google sign-in failed. Please try again.' }
  }

  return { success: true, data: { url: data.url } }
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
