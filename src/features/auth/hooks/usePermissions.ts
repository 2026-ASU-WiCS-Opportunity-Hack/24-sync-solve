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
   * @param chapterId - If provided, also checks chapter-specific roles for that chapter.
   */
  function hasUserPermission(permission: Permission, chapterId?: string | null): boolean {
    if (!user || user.isSuspended) return false

    // super_admin has all permissions globally
    if (hasPermission(user.role, permission)) return true

    // Check chapter-specific roles from user_chapter_roles
    if (chapterId) {
      const roles: UserRole[] = user.chapterRoles[chapterId] ?? []
      if (hasAnyRolePermission(roles, permission)) return true
    }

    return false
  }

  return {
    hasPermission: hasUserPermission,
    isLoading,
    chapterRoles: user?.chapterRoles ?? {},
    isSuspended: user?.isSuspended ?? false,
    globalRole: user?.role ?? 'user',
  }
}
