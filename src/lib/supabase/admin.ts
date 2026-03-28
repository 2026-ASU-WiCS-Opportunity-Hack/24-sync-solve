import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Admin (secret key) Supabase client.
 * ONLY use in:
 *   - API Route handlers (webhooks)
 *   - Server Actions that need to bypass RLS (Stripe webhook, admin provisioning)
 *
 * NEVER import this in Client Components — it exposes the secret key.
 * NEVER use NEXT_PUBLIC_ prefix for SUPABASE_SECRET_KEY.
 */
export function createAdminClient() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const secretKey = process.env['SUPABASE_SECRET_KEY']

  if (!url || !secretKey) {
    throw new Error('Missing Supabase admin credentials. Check environment variables.')
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
