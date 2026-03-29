import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Payment, Profile } from '@/types'

export interface PaymentAdminRow extends Payment {
  user_email: string | null
  user_name: string | null
  chapter_name: string | null
  chapter_slug: string | null
}

/**
 * Fetch all payments for admin listing.
 * Joins user profile and chapter data.
 */
export async function getPaymentsAdmin(
  supabase: SupabaseClient<Database>,
  options: {
    chapterId?: string
    status?: Payment['status']
    limit?: number
    offset?: number
  } = {}
): Promise<{ items: PaymentAdminRow[]; total: number }> {
  const { chapterId, status, limit = 50, offset = 0 } = options

  let query = supabase
    .from('payments')
    .select(
      `
      *,
      profile:profiles!payments_user_id_fkey(email, full_name),
      chapter:chapters!payments_chapter_id_fkey(name, slug)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (chapterId) query = query.eq('chapter_id', chapterId)
  if (status) query = query.eq('status', status)

  const { data, error, count } = await query

  if (error || !data) return { items: [], total: 0 }

  const items: PaymentAdminRow[] = data.map((row) => {
    const { profile, chapter, ...rest } = row as typeof row & {
      profile: Pick<Profile, 'email' | 'full_name'> | null
      chapter: { name: string; slug: string } | null
    }
    return {
      ...rest,
      user_email: profile?.email ?? null,
      user_name: profile?.full_name ?? null,
      chapter_name: chapter?.name ?? null,
      chapter_slug: chapter?.slug ?? null,
    }
  })

  return { items, total: count ?? 0 }
}

export interface PaymentStats {
  /** All payments in the last 30 days */
  totalLast30: number
  /** Succeeded payments in the last 30 days */
  succeededLast30: number
  /** Conversion rate as 0–100 integer (succeeded / total * 100) */
  conversionRate: number
  /** Total revenue (cents) from succeeded payments in the last 30 days */
  revenueLast30: number
  /** Breakdown of succeeded payment totals (cents) by type */
  revenueByType: Record<string, number>
}

/**
 * Aggregate payment stats for a dashboard.
 * Optionally scoped to a specific chapter (pass chapterId) or global (omit).
 */
export async function getPaymentStats(
  supabase: SupabaseClient<Database>,
  chapterId?: string
): Promise<PaymentStats> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('payments')
    .select('status, amount, payment_type, created_at')
    .gte('created_at', since)

  if (chapterId) query = query.eq('chapter_id', chapterId)

  const { data, error } = await query

  if (error || !data) {
    return {
      totalLast30: 0,
      succeededLast30: 0,
      conversionRate: 0,
      revenueLast30: 0,
      revenueByType: {},
    }
  }

  const totalLast30 = data.length
  const succeeded = data.filter((p) => p.status === 'succeeded')
  const succeededLast30 = succeeded.length
  const conversionRate = totalLast30 > 0 ? Math.round((succeededLast30 / totalLast30) * 100) : 0
  const revenueLast30 = succeeded.reduce((sum, p) => sum + (p.amount ?? 0), 0)

  const revenueByType: Record<string, number> = {}
  for (const p of succeeded) {
    revenueByType[p.payment_type] = (revenueByType[p.payment_type] ?? 0) + (p.amount ?? 0)
  }

  return { totalLast30, succeededLast30, conversionRate, revenueLast30, revenueByType }
}

/**
 * Fetch payments scoped to a single chapter for chapter lead reporting.
 * Only returns payments linked to the specified chapterId.
 */
export async function getChapterPayments(
  supabase: SupabaseClient<Database>,
  chapterId: string,
  options: {
    status?: Payment['status']
    limit?: number
    offset?: number
  } = {}
): Promise<{ items: PaymentAdminRow[]; total: number; totalCollected: number }> {
  const { status, limit = 100, offset = 0 } = options

  const result = await getPaymentsAdmin(supabase, { chapterId, status, limit, offset })

  const totalCollected = result.items
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0)

  return { ...result, totalCollected }
}

/**
 * Fetch a user's own payment history.
 */
export async function getUserPayments(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data
}
