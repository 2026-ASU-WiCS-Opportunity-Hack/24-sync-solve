import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { checkRateLimit, getClientIp } from '@/lib/ratelimit'

// Paths where Supabase auth is deliberately bypassed
const STRIPE_WEBHOOK_PATH = '/api/payments/webhooks'

// Protected routes that require a verified email address
const EMAIL_VERIFIED_PATHS = ['/dashboard', '/admin']

// Auth pages that should be rate-limited to slow down brute-force attempts
const RATE_LIMITED_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']

const RESERVED_PATHS = new Set([
  'admin',
  'api',
  'dashboard',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
])

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Skip static files and Next.js internals ──────────────────────────────
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith(STRIPE_WEBHOOK_PATH) ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }

  // ── 2. Rate-limit auth pages ─────────────────────────────────────────────────
  // Protects against credential-stuffing and brute-force login attempts.
  // The in-memory store works per-instance; swap with @upstash/ratelimit for
  // distributed production deployments.
  if (RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p))) {
    const ip = getClientIp(request.headers)
    const { allowed, retryAfterMs } = checkRateLimit(`auth:${ip}`)
    if (!allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(retryAfterMs / 1_000)),
          'Content-Type': 'text/plain',
        },
      })
    }
  }

  // ── 3. Refresh Supabase session (required for SSR auth) ──────────────────────
  let response = NextResponse.next({ request })
  const { response: updatedResponse, user } = await updateSession(request, response)
  response = updatedResponse

  // ── 4. Account suspension check ──────────────────────────────────────────────
  // Allow /suspended and /api routes to pass through
  if (user && !pathname.startsWith('/suspended') && !pathname.startsWith('/api')) {
    const suspensionCheck = createServerClient<Database>(
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

    const { data: suspendedProfile } = await suspensionCheck
      .from('profiles')
      .select('is_suspended')
      .eq('id', user.id)
      .single()

    if (suspendedProfile?.is_suspended) {
      return NextResponse.redirect(new URL('/suspended', request.url))
    }
  }

  // ── 5. Email verification check ───────────────────────────────────────────────
  // Authenticated users who have not yet confirmed their email address are
  // redirected to /verify-email when they try to access protected routes.
  // Public pages (home, coaches, events, contact) remain accessible.
  if (user && !user.email_confirmed_at) {
    const isProtected =
      EMAIL_VERIFIED_PATHS.some((p) => pathname.startsWith(p)) ||
      !!pathname.match(/^\/[^/]+\/edit/) ||
      !!pathname.match(/^\/[^/]+\/manage/)

    if (isProtected && !pathname.startsWith('/verify-email')) {
      return NextResponse.redirect(new URL('/verify-email', request.url))
    }
  }

  // ── 6. Protect /dashboard/* routes ──────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── 7. Protect /admin/* routes ──────────────────────────────────────────────
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

  // ── 8. Protect /[chapter]/edit/* routes ─────────────────────────────────────
  const editMatch = pathname.match(/^\/([^/]+)\/edit/)
  if (editMatch) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    // Role check for chapter editing is handled in server actions (RLS covers DB)
  }

  // ── 9. Protect /[chapter]/manage/* routes ────────────────────────────────────
  const manageMatch = pathname.match(/^\/([^/]+)\/manage/)
  if (manageMatch) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    // Chapter-lead role check is enforced in [chapter]/manage/layout.tsx
  }

  // ── 10. Validate chapter slugs for /[chapter]/* routes ───────────────────────
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]

  if (
    firstSegment &&
    !RESERVED_PATHS.has(firstSegment) &&
    !firstSegment.startsWith('(') &&
    segments.length > 0 &&
    /^[a-z0-9-]+$/.test(firstSegment)
  ) {
    // Slug validation and 404 handled in [chapter]/layout.tsx
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
