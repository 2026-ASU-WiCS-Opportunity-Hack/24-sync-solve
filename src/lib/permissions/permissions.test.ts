import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  getPermissions,
  hasAnyRolePermission,
  roleCanAssign,
  roleCanSuspend,
  type Permission,
} from './permissions'

describe('hasPermission', () => {
  it('super_admin has all permissions', () => {
    const allPerms: Permission[] = [
      'content:edit',
      'content:approve',
      'content:create',
      'coach_profile:approve',
      'coach_profile:publish',
      'role:assign_chapter_lead',
      'role:assign_coach',
      'role:assign_content_editor',
      'role:revoke',
      'suspend:account',
      'suspend:role',
      'suspend:coach_visibility',
      'unsuspend:account',
      'unsuspend:role',
      'unsuspend:coach_visibility',
      'payment:view_global',
      'audit:view_global',
      'chapter:create',
      'chapter:delete',
      'user:view_list',
    ]
    for (const perm of allPerms) {
      expect(hasPermission('super_admin', perm)).toBe(true)
    }
  })

  it('chapter_lead has chapter-scoped permissions but not global ones', () => {
    expect(hasPermission('chapter_lead', 'content:edit')).toBe(true)
    expect(hasPermission('chapter_lead', 'content:approve')).toBe(true)
    expect(hasPermission('chapter_lead', 'role:assign_coach')).toBe(true)
    expect(hasPermission('chapter_lead', 'role:assign_chapter_lead')).toBe(false)
    expect(hasPermission('chapter_lead', 'suspend:account')).toBe(false)
    expect(hasPermission('chapter_lead', 'chapter:create')).toBe(false)
    expect(hasPermission('chapter_lead', 'chapter:delete')).toBe(false)
    expect(hasPermission('chapter_lead', 'payment:view_global')).toBe(false)
    expect(hasPermission('chapter_lead', 'audit:view_global')).toBe(false)
    expect(hasPermission('chapter_lead', 'user:view_list')).toBe(false)
  })

  it('content_editor has limited permissions', () => {
    expect(hasPermission('content_editor', 'content:edit')).toBe(true)
    expect(hasPermission('content_editor', 'content:create')).toBe(true)
    expect(hasPermission('content_editor', 'event:create')).toBe(true)
    expect(hasPermission('content_editor', 'event:edit')).toBe(true)
    expect(hasPermission('content_editor', 'content:approve')).toBe(false)
    expect(hasPermission('content_editor', 'role:assign_coach')).toBe(false)
    expect(hasPermission('content_editor', 'suspend:role')).toBe(false)
  })

  it('coach only has payment:view_own', () => {
    expect(hasPermission('coach', 'payment:view_own')).toBe(true)
    expect(hasPermission('coach', 'content:edit')).toBe(false)
    expect(hasPermission('coach', 'event:create')).toBe(false)
  })

  it('user only has payment:view_own', () => {
    expect(hasPermission('user', 'payment:view_own')).toBe(true)
    expect(hasPermission('user', 'content:edit')).toBe(false)
  })
})

describe('getPermissions', () => {
  it('returns non-empty array for super_admin', () => {
    expect(getPermissions('super_admin').length).toBeGreaterThan(0)
  })

  it('returns empty array for public', () => {
    expect(getPermissions('public')).toEqual([])
  })
})

describe('hasAnyRolePermission', () => {
  it('returns true if any role has the permission', () => {
    expect(hasAnyRolePermission(['coach', 'chapter_lead'], 'content:edit')).toBe(true)
    expect(hasAnyRolePermission(['coach', 'user'], 'content:edit')).toBe(false)
  })

  it('returns false for empty roles array', () => {
    expect(hasAnyRolePermission([], 'content:edit')).toBe(false)
  })
})

describe('roleCanAssign', () => {
  it('super_admin can assign any role', () => {
    expect(roleCanAssign('super_admin', 'chapter_lead')).toBe(true)
    expect(roleCanAssign('super_admin', 'coach')).toBe(true)
    expect(roleCanAssign('super_admin', 'super_admin')).toBe(true)
  })

  it('chapter_lead can assign coach and content_editor only', () => {
    expect(roleCanAssign('chapter_lead', 'coach')).toBe(true)
    expect(roleCanAssign('chapter_lead', 'content_editor')).toBe(true)
    expect(roleCanAssign('chapter_lead', 'chapter_lead')).toBe(false)
    expect(roleCanAssign('chapter_lead', 'super_admin')).toBe(false)
  })

  it('coach and user cannot assign anyone', () => {
    expect(roleCanAssign('coach', 'coach')).toBe(false)
    expect(roleCanAssign('user', 'user')).toBe(false)
  })
})

describe('roleCanSuspend', () => {
  it('super_admin can suspend any role', () => {
    expect(roleCanSuspend('super_admin', 'chapter_lead')).toBe(true)
    expect(roleCanSuspend('super_admin', 'super_admin')).toBe(true)
  })

  it('chapter_lead can suspend coach and content_editor', () => {
    expect(roleCanSuspend('chapter_lead', 'coach')).toBe(true)
    expect(roleCanSuspend('chapter_lead', 'content_editor')).toBe(true)
    expect(roleCanSuspend('chapter_lead', 'chapter_lead')).toBe(false)
    expect(roleCanSuspend('chapter_lead', 'super_admin')).toBe(false)
  })

  it('coach cannot suspend anyone', () => {
    expect(roleCanSuspend('coach', 'user')).toBe(false)
  })
})
