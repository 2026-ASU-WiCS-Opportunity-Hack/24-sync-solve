/**
 * Lightweight in-process rate limiter for auth routes.
 *
 * ⚠️  Uses module-level memory — suitable for development and single-instance
 * deployments. For serverless / multi-replica production (Vercel Edge), replace
 * with @upstash/ratelimit + @upstash/redis:
 *
 *   import { Ratelimit } from '@upstash/ratelimit'
 *   import { Redis } from '@upstash/redis'
 *   export const authLimiter = new Ratelimit({
 *     redis: Redis.fromEnv(),
 *     limiter: Ratelimit.slidingWindow(20, '15 m'),
 *   })
 */

const WINDOW_MS = 15 * 60 * 1_000 // 15-minute sliding window
const MAX_REQUESTS = 20 // requests per IP per window

interface Entry {
  count: number
  resetAt: number
}

const _store = new Map<string, Entry>()
let _lastCleanup = Date.now()

/** Remove expired entries at most once per minute to bound memory usage */
function cleanExpired(): void {
  const now = Date.now()
  if (now - _lastCleanup < 60_000) return
  _lastCleanup = now
  for (const [key, entry] of _store) {
    if (now > entry.resetAt) _store.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  /** Milliseconds until the window resets — 0 when allowed */
  retryAfterMs: number
}

/**
 * Check whether the given key (typically `"auth:<ip>"`) is within the rate
 * limit.  Increments the counter on every call — call this once per request.
 */
export function checkRateLimit(key: string): RateLimitResult {
  cleanExpired()
  const now = Date.now()
  const entry = _store.get(key)

  if (!entry || now > entry.resetAt) {
    _store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, retryAfterMs: 0 }
}

/**
 * Extract the best-effort client IP from Next.js middleware request headers.
 * Returns `'unknown'` if no IP header is present.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown'
  return headers.get('x-real-ip') ?? 'unknown'
}
