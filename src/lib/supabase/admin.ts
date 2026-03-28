import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Admin (service role) Supabase client.
 * ONLY use in:
 *   - API Route handlers (webhooks)
 *   - Server Actions that need to bypass RLS (Stripe webhook, admin provisioning)
 *
 * NEVER import this in Client Components — it exposes the service role key.
 * NEVER use NEXT_PUBLIC_ prefix for SUPABASE_SERVICE_ROLE_KEY.
 */
export function createAdminClient() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase admin credentials. Check environment variables.')
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
