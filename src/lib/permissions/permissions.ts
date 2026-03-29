/**
 * Centralized permission system.
 * Pure TypeScript — no React, no Supabase.
 * Importable from server and client code.
 *
 * Single source of truth: change one entry in PERMISSION_MATRIX
 * to reconfigure who can do what across the entire platform.
 */

import type { UserRole } from '@/types/database'

// ── Permission strings ──────────────────────────────────────────────────────

export type Permission =
  | 'content:edit'
  | 'content:approve'
  | 'content:create'
  | 'coach_profile:approve'
  | 'coach_profile:publish'
  | 'coach_application:review'
  | 'event:create'
  | 'event:edit'
  | 'event:delete'
  | 'role:assign_coach'
  | 'role:assign_content_editor'
  | 'role:assign_chapter_lead'
  | 'role:revoke'
  | 'suspend:account'
  | 'suspend:role'
  | 'suspend:coach_visibility'
  | 'unsuspend:account'
  | 'unsuspend:role'
  | 'unsuspend:coach_visibility'
  | 'payment:view_own'
  | 'payment:view_chapter'
  | 'payment:view_global'
  | 'audit:view_chapter'
  | 'audit:view_global'
  | 'chapter:manage_settings'
  | 'chapter:create'
  | 'chapter:delete'
  | 'user:view_list'
  | 'user:view_chapter_list'

// ── Permission matrix ───────────────────────────────────────────────────────

/** Permissions granted to each role at the chapter or global level. */
const PERMISSION_MATRIX: Record<UserRole, Permission[]> = {
  super_admin: [
    'content:edit',
    'content:approve',
    'content:create',
    'coach_profile:approve',
    'coach_profile:publish',
    'coach_application:review',
    'event:create',
    'event:edit',
    'event:delete',
    'role:assign_coach',
    'role:assign_content_editor',
    'role:assign_chapter_lead',
    'role:revoke',
    'suspend:account',
    'suspend:role',
    'suspend:coach_visibility',
    'unsuspend:account',
    'unsuspend:role',
    'unsuspend:coach_visibility',
    'payment:view_own',
    'payment:view_chapter',
    'payment:view_global',
    'audit:view_chapter',
    'audit:view_global',
    'chapter:manage_settings',
    'chapter:create',
    'chapter:delete',
    'user:view_list',
    'user:view_chapter_list',
  ],
  chapter_lead: [
    'content:edit',
    'content:approve', // ← remove to restrict to super_admin only
    'content:create',
    'coach_profile:approve', // ← remove to restrict to super_admin only
    'coach_profile:publish', // ← remove to restrict to super_admin only
    'coach_application:review',
    'event:create',
    'event:edit',
    'event:delete',
    'role:assign_coach',
    'role:assign_content_editor',
    'role:revoke',
    'suspend:role',
    'suspend:coach_visibility',
    'unsuspend:role',
    'unsuspend:coach_visibility',
    'payment:view_own',
    'payment:view_chapter',
    'audit:view_chapter',
    'chapter:manage_settings',
    'user:view_chapter_list',
  ],
  content_editor: [
    'content:edit',
    'content:create',
    'event:create',
    'event:edit',
    'payment:view_own',
  ],
  coach: ['payment:view_own'],
  user: ['payment:view_own'],
  // 'public' stays in DB enum but is blocked by CHECK constraints — never used in new code
  public: [],
}

// ── Role assignment hierarchy ───────────────────────────────────────────────

/**
 * Which roles an actor can assign.
 * chapter_lead can assign coach/content_editor within their chapter.
 * super_admin can assign any role including chapter_lead.
 */
const ASSIGNABLE_ROLES: Record<UserRole, UserRole[]> = {
  super_admin: ['super_admin', 'chapter_lead', 'content_editor', 'coach', 'user'],
  chapter_lead: ['coach', 'content_editor'],
  content_editor: [],
  coach: [],
  user: [],
  public: [],
}

/**
 * Which roles an actor can suspend.
 * chapter_lead can suspend coach/content_editor in their chapter.
 * super_admin can suspend any role.
 */
const SUSPENDABLE_ROLES: Record<UserRole, UserRole[]> = {
  super_admin: ['super_admin', 'chapter_lead', 'content_editor', 'coach', 'user'],
  chapter_lead: ['coach', 'content_editor'],
  content_editor: [],
  coach: [],
  user: [],
  public: [],
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Check whether a role has the given permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSION_MATRIX[role]?.includes(permission) ?? false
}

/**
 * Get all permissions for a role.
 */
export function getPermissions(role: UserRole): Permission[] {
  return PERMISSION_MATRIX[role] ?? []
}

/**
 * Check if any role in the array has the given permission.
 * Useful for multi-role users (chapter_roles map).
 */
export function hasAnyRolePermission(roles: UserRole[], permission: Permission): boolean {
  return roles.some((r) => hasPermission(r, permission))
}

/**
 * Check whether `actorRole` can assign `targetRole`.
 */
export function roleCanAssign(actorRole: UserRole, targetRole: UserRole): boolean {
  return ASSIGNABLE_ROLES[actorRole]?.includes(targetRole) ?? false
}

/**
 * Check whether `actorRole` can suspend a user with `targetRole`.
 */
export function roleCanSuspend(actorRole: UserRole, targetRole: UserRole): boolean {
  return SUSPENDABLE_ROLES[actorRole]?.includes(targetRole) ?? false
}
