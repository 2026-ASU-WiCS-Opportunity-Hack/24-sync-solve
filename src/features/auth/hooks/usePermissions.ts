'use client'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { hasPermission, hasAnyRolePermission, type Permission } from '@/lib/permissions/permissions'
import type { UserRole } from '@/types'

/**
 * Client-side permissions hook for UI rendering.
 * DO NOT use for authorization — that is enforced server-side.
 *
 * Checks permissions based on the user's global role and chapter-specific roles.
 */
export function usePermissions() {
  const { user, isLoading } = useAuth()

  /**
   * Check if the current user has a permission.
   * @param permission - The permission to check.
   * @param chapterId - If provided, checks chapter-specific roles for that chapter.
   *
   * Mirrors the server-side canPerformInChapter logic:
   * - super_admin has all permissions globally
   * - For chapter-scoped checks, user_chapter_roles is the source of truth
   * - The global role only falls back for the user's primary chapter (user.chapterId)
   */
  function hasUserPermission(permission: Permission, chapterId?: string | null): boolean {
    if (!user || user.isSuspended) return false

    // super_admin bypasses chapter scoping
    if (user.role === 'super_admin') return hasPermission('super_admin', permission)

    if (chapterId) {
      // Check chapter-specific roles (user_chapter_roles)
      const roles: UserRole[] = user.chapterRoles[chapterId] ?? []
      if (hasAnyRolePermission(roles, permission)) return true

      // Fall back to global role only for the user's primary chapter.
      // This prevents chapter_lead from appearing to have manage access
      // to chapters they don't belong to.
      if (chapterId === user.chapterId) {
        return hasPermission(user.role, permission)
      }

      return false
    }

    // No chapter context — use global role only
    return hasPermission(user.role, permission)
  }

  return {
    hasPermission: hasUserPermission,
    isLoading,
    chapterRoles: user?.chapterRoles ?? {},
    isSuspended: user?.isSuspended ?? false,
    globalRole: user?.role ?? 'user',
  }
}
