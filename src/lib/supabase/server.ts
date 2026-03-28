import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Server (Server Component, Server Action, Route Handler) Supabase client.
 * Uses cookie-based session management for Next.js App Router.
 * ALWAYS use getClaims() for auth checks — never trust getSession().
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll() called from Server Component — cookies can't be set
            // This is fine; the middleware will handle session refresh
          }
        },
      },
    }
  )
}
