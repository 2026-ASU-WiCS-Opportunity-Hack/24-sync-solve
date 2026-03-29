import { createServerClient } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

/**
 * Update Supabase session in Next.js middleware.
 * Must be called in middleware.ts to refresh auth tokens.
 * Uses getUser() — never getSession() — for security (validates JWT server-side).
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse
): Promise<{
  response: NextResponse
  user: { id: string; email?: string; email_confirmed_at?: string | null } | null
}> {
  const supabase = createServerClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the JWT with the Supabase auth server on every request.
  // This is the secure approach — never trust getSession() which only reads the local cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}
