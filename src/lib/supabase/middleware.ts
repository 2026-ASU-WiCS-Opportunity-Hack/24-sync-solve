import { createServerClient } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

/**
 * Update Supabase session in Next.js middleware.
 * Must be called in middleware.ts to refresh auth tokens.
 * Uses getClaims() — never getSession() — for security.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse
): Promise<{ response: NextResponse; user: { id: string; email?: string } | null }> {
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

  // Use getClaims() to validate JWT locally (faster than getUser() network call)
  // For highly sensitive routes, swap to supabase.auth.getUser() for server-side validation
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}
