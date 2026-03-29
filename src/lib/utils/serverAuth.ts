import { createClient } from '@/lib/supabase/server'
import {
  getPermissionContext,
  canPerformInChapter,
  requirePermission,
} from '@/lib/permissions/context'
import type { UserRole } from '@/types'

/**
 * Check the current authenticated user's role.
 * Returns null if not authenticated or profile not found.
 * Server-side only — never call in client components.
 *
 * @deprecated Use getPermissionContext() from @/lib/permissions for new code.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const ctx = await getPermissionContext()
  return ctx?.globalRole ?? null
}

/**
 * Check if the current user can edit content for a given chapter.
 * super_admin can edit any chapter (or global pages with chapterId=null).
 *
 * @deprecated Use requirePermission('content:edit', chapterId) for new server actions.
 */
export async function canEditChapter(chapterId: string | null): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, chapter_id, is_suspended')
    .eq('id', user.id)
    .single()

  if (!profile) return false
  if (profile.is_suspended) return false

  if (profile.role === 'super_admin') return true

  if (profile.role === 'chapter_lead' || profile.role === 'content_editor') {
    if (chapterId === null) return false
    if (profile.chapter_id === chapterId) return true
  }

  // Also check user_chapter_roles for multi-chapter assignments
  if (chapterId) {
    const { data: chapterRole } = await supabase
      .from('user_chapter_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('chapter_id', chapterId)
      .in('role', ['chapter_lead', 'content_editor'])
      .eq('is_active', true)
      .single()

    if (chapterRole) return true
  }

  return false
}

// Re-export centralized helpers for backwards compatibility
export { getPermissionContext, canPerformInChapter, requirePermission }
