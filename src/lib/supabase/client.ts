import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Browser (Client Component) Supabase client.
 * Use in components with 'use client' directive.
 * Reads from NEXT_PUBLIC_ env vars — safe for client bundles.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']!
  )
}
