import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, UserRole } from '@/types'
import type { ChapterRoleRow, ChapterMemberRow } from '@/features/rbac/types'

/**
 * Get all active chapter roles for a user, with chapter info.
 */
export async function getUserChapterRoles(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ChapterRoleRow[]> {
  const { data, error } = await supabase
    .from('user_chapter_roles')
    .select(
      `
      chapter_id,
      role,
      chapter:chapters!user_chapter_roles_chapter_id_fkey(name, slug)
    `
    )
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error || !data) return []

  // Group by chapter
  const chapterMap = new Map<string, ChapterRoleRow>()
  for (const row of data) {
    const chapter = row.chapter as { name: string; slug: string } | null
    const existing = chapterMap.get(row.chapter_id)
    if (existing) {
      existing.roles.push(row.role as UserRole)
    } else {
      chapterMap.set(row.chapter_id, {
        chapterId: row.chapter_id,
        chapterName: chapter?.name ?? null,
        chapterSlug: chapter?.slug ?? null,
        roles: [row.role as UserRole],
      })
    }
  }

  return Array.from(chapterMap.values())
}

/**
 * Get all members of a chapter with their roles.
 * Combines profile.chapter_id (legacy) and user_chapter_roles (multi-chapter).
 */
export async function getChapterMembers(
  supabase: SupabaseClient<Database>,
  chapterId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ items: ChapterMemberRow[]; total: number }> {
  const { limit = 50, offset = 0 } = options

  // Members via user_chapter_roles
  const { data: ucr, error: ucrError } = await supabase
    .from('user_chapter_roles')
    .select(
      `
      user_id,
      role,
      is_active,
      profile:profiles!user_chapter_roles_user_id_fkey(
        id, email, full_name, avatar_url, role, is_suspended
      )
    `,
      { count: 'exact' }
    )
    .eq('chapter_id', chapterId)
    .eq('is_active', true)
    .range(offset, offset + limit - 1)

  if (ucrError || !ucr) return { items: [], total: 0 }

  const memberMap = new Map<string, ChapterMemberRow>()

  for (const row of ucr) {
    const profile = row.profile as {
      id: string
      email: string
      full_name: string | null
      avatar_url: string | null
      role: string
      is_suspended: boolean
    } | null

    if (!profile) continue

    const existing = memberMap.get(profile.id)
    if (existing) {
      existing.chapterRoles.push(row.role as UserRole)
    } else {
      memberMap.set(profile.id, {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        globalRole: profile.role as UserRole,
        chapterRoles: [row.role as UserRole],
        isSuspended: profile.is_suspended,
      })
    }
  }

  return { items: Array.from(memberMap.values()), total: memberMap.size }
}
