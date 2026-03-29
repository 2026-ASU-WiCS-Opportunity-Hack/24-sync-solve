/**
 * RBAC feature types.
 */

import type { UserRole } from '@/types'

export interface ChapterRoleRow {
  chapterId: string
  chapterName: string | null
  chapterSlug: string | null
  roles: UserRole[]
}

export interface ChapterMemberRow {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  globalRole: UserRole
  chapterRoles: UserRole[]
  isSuspended: boolean
}
