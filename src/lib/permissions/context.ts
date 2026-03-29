/**
 * Server-side permission context resolution.
 * Fetches the current user's full permission context in a single DB call.
 * Server-side only — never import in client components.
 */

import { createClient } from '@/lib/supabase/server'
import { hasPermission, hasAnyRolePermission, type Permission } from '@/lib/permissions/permissions'
import type { UserRole } from '@/types/database'

// ── Types ───────────────────────────────────────────────────────────────────

export interface PermissionContext {
  userId: string
  globalRole: UserRole
  /** chapterId → active roles in that chapter */
  chapterRoles: Map<string, UserRole[]>
  isSuspended: boolean
  /**
   * The user's primary chapter (profiles.chapter_id).
   * Used as a fallback when the user has a chapter-scoped global role
   * (e.g. chapter_lead) but no user_chapter_roles entry for a chapter.
   * NEVER grants access to a chapter other than this one.
   */
  primaryChapterId: string | null
}

// ── Context builder ─────────────────────────────────────────────────────────

/**
 * Resolve the current user's full permission context.
 * Returns null if not authenticated.
 *
 * Fetches profile + user_chapter_roles in a single parallel call.
 */
export async function getPermissionContext(): Promise<PermissionContext | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Parallel fetch: profile + chapter roles
  const [profileResult, chapterRolesResult] = await Promise.all([
    supabase.from('profiles').select('role, is_suspended, chapter_id').eq('id', user.id).single(),
    supabase
      .from('user_chapter_roles')
      .select('chapter_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true),
  ])

  if (!profileResult.data) return null

  const { role, is_suspended, chapter_id } = profileResult.data

  // Build chapterId → roles[] map
  const chapterRoles = new Map<string, UserRole[]>()
  for (const row of chapterRolesResult.data ?? []) {
    const existing = chapterRoles.get(row.chapter_id) ?? []
    existing.push(row.role as UserRole)
    chapterRoles.set(row.chapter_id, existing)
  }

  return {
    userId: user.id,
    globalRole: role as UserRole,
    chapterRoles,
    isSuspended: is_suspended ?? false,
    primaryChapterId: chapter_id ?? null,
  }
}

// ── Permission checker ──────────────────────────────────────────────────────

/**
 * Check if the user can perform an action in a specific chapter context.
 *
 * Rules:
 * - Suspended users cannot do anything (treated as 'user')
 * - super_admin bypasses chapter scoping (global permissions apply)
 * - For chapter-scoped actions, checks both profile.chapter_id fallback
 *   and user_chapter_roles entries for that chapter
 */
export function canPerformInChapter(
  ctx: PermissionContext,
  chapterId: string | null,
  permission: Permission
): boolean {
  if (ctx.isSuspended) return false

  // super_admin has global permissions
  if (ctx.globalRole === 'super_admin') {
    return hasPermission('super_admin', permission)
  }

  // Check chapter-specific roles (user_chapter_roles)
  if (chapterId) {
    const chapterSpecificRoles = ctx.chapterRoles.get(chapterId) ?? []
    if (chapterSpecificRoles.length > 0) {
      if (hasAnyRolePermission(chapterSpecificRoles, permission)) return true
    }

    // Fall back to global role ONLY for the user's primary chapter.
    // This supports legacy single-chapter chapter_leads who have
    // profiles.chapter_id set but no user_chapter_roles entry.
    // It MUST NOT grant access to any other chapter — that's the security invariant.
    if (chapterId === ctx.primaryChapterId) {
      return hasPermission(ctx.globalRole, permission)
    }

    return false
  }

  return false
}

// ── Action guard ────────────────────────────────────────────────────────────

/**
 * Require the current user to have a permission.
 * Throws an error string if denied — use in server actions.
 *
 * @throws string error message on permission denied
 */
export async function requirePermission(
  permission: Permission,
  chapterId?: string | null
): Promise<PermissionContext> {
  const ctx = await getPermissionContext()

  if (!ctx) {
    throw new Error('Authentication required.')
  }

  if (ctx.isSuspended) {
    throw new Error('Your account is suspended.')
  }

  const allowed =
    chapterId !== undefined
      ? canPerformInChapter(ctx, chapterId, permission)
      : hasPermission(ctx.globalRole, permission)

  if (!allowed) {
    throw new Error('You do not have permission to perform this action.')
  }

  return ctx
}
