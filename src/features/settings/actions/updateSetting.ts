'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/types'

/**
 * Update a global setting by key.
 * Restricted to super_admin only — verified server-side.
 *
 * Designed to be passed as a bound server action prop to
 * InlineEditableText:
 *   <InlineEditableText onSave={updateGlobalSetting.bind(null, 'footer.tagline')} />
 */
export async function updateGlobalSetting(key: string, value: string): Promise<ActionResult> {
  if (!key.trim()) return { success: false, error: 'Setting key is required.' }
  if (value.length > 500) return { success: false, error: 'Value must be under 500 characters.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Authentication required.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return { success: false, error: 'Super admin access required.' }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('global_settings')
    .upsert(
      { key, value, updated_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

  if (error) return { success: false, error: error.message }

  // Bust caches for the entire site — header and footer appear on every page
  revalidatePath('/', 'layout')

  return { success: true, data: null, message: 'Setting saved.' }
}
