import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

/**
 * Check the current authenticated user's role.
 * Returns null if not authenticated or profile not found.
 * Server-side only — never call in client components.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role ?? null
}

/**
 * Check if the current user can edit content for a given chapter.
 * super_admin can edit any chapter (or global pages with chapterId=null).
 */
export async function canEditChapter(chapterId: string | null): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, chapter_id')
    .eq('id', user.id)
    .single()

  if (!profile) return false

  if (profile.role === 'super_admin') return true

  if (profile.role === 'chapter_lead' || profile.role === 'content_editor') {
    // For global pages (chapterId=null), only super_admin can edit
    if (chapterId === null) return false
    return profile.chapter_id === chapterId
  }

  return false
}
