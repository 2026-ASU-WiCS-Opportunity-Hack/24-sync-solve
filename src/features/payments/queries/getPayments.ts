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
