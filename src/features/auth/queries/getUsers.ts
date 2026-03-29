import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Profile } from '@/types'

export interface UserAdminRow extends Profile {
  chapter_name: string | null
  chapter_slug: string | null
}

/**
 * Fetch all user profiles for admin listing.
 * Joins chapter data for display.
 */
export async function getUsersAdmin(
  supabase: SupabaseClient<Database>,
  options: {
    role?: Profile['role']
    limit?: number
    offset?: number
  } = {}
): Promise<{ items: UserAdminRow[]; total: number }> {
  const { role, limit = 50, offset = 0 } = options

  let query = supabase
    .from('profiles')
    .select(
      `
      *,
      chapter:chapters!profiles_chapter_id_fkey(name, slug)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (role) query = query.eq('role', role)

  const { data, error, count } = await query

  if (error || !data) return { items: [], total: 0 }

  const items: UserAdminRow[] = data.map((row) => {
    const { chapter, ...rest } = row as typeof row & {
      chapter: { name: string; slug: string } | null
    }
    return {
      ...rest,
      chapter_name: chapter?.name ?? null,
      chapter_slug: chapter?.slug ?? null,
    }
  })

  return { items, total: count ?? 0 }
}

/**
 * Update a user's role. Super admin only — enforced via RLS.
 * Includes last-admin protection: cannot demote the last active super_admin.
 */
export async function updateUserRole(
  supabase: SupabaseClient<Database>,
  userId: string,
  role: Profile['role']
): Promise<{ error: string | null }> {
  // Last-admin protection
  if (role !== 'super_admin') {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (currentProfile?.role === 'super_admin') {
      const { data: count } = await supabase.rpc('count_active_super_admins')
      if ((count ?? 0) <= 1) {
        return { error: 'Cannot demote the last active super admin. Promote another admin first.' }
      }
    }
  }

  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  return { error: error?.message ?? null }
}
