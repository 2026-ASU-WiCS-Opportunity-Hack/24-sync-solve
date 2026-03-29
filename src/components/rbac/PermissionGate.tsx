'use client'

import type { ReactNode } from 'react'
import { usePermissions } from '@/features/auth/hooks/usePermissions'
import type { Permission } from '@/lib/permissions/permissions'

interface PermissionGateProps {
  permission: Permission
  chapterId?: string | null
  /** Content to render when permission is denied. Defaults to null (renders nothing). */
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Client component that renders children only if the current user
 * has the given permission (optionally scoped to a chapter).
 *
 * For authorization decisions, use requirePermission() in server actions.
 * This component is for UI rendering only.
 */
export function PermissionGate({
  permission,
  chapterId,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, isLoading } = usePermissions()

  if (isLoading) return null

  return hasPermission(permission, chapterId) ? <>{children}</> : <>{fallback}</>
}
