import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Chapter slugs cached in-memory (invalidated periodically in production via ISR)
// For MVP, we query DB in middleware — in production consider edge KV caching
const RESERVED_PATHS = new Set([
  'admin',
  'api',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Skip static files and Next.js internals ──────────────────────────────
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/payments/webhooks') || // Stripe webhooks: no auth
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }

  // ── 2. Refresh Supabase session (required for SSR auth) ──────────────────────
  let response = NextResponse.next({ request })
  const { response: updatedResponse, user } = await updateSession(request, response)
  response = updatedResponse

  // ── 3. Protect /admin/* routes ──────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check super_admin role
    const supabase = createServerClient<Database>(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // ── 4. Protect /[chapter]/edit/* routes ─────────────────────────────────────
  const editMatch = pathname.match(/^\/([^/]+)\/edit/)
  if (editMatch) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    // Role check for chapter editing is handled in server actions (RLS covers DB)
  }

  // ── 5. Validate chapter slugs for /[chapter]/* routes ───────────────────────
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]

  if (
    firstSegment &&
    !RESERVED_PATHS.has(firstSegment) &&
    !firstSegment.startsWith('(') &&
    segments.length > 0 &&
    // Only validate if it looks like a chapter slug (lowercase alphanumeric + hyphens)
    /^[a-z0-9-]+$/.test(firstSegment)
  ) {
    // We'll rely on the [chapter]/layout.tsx to validate and 404 if not found
    // Middleware doesn't query DB for every request to keep edge latency low
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
