/**
 * Permissions barrel — server-safe re-exports.
 * For client usage, import from permissions.ts directly (no context.ts).
 */

export type { Permission } from './permissions'
export {
  hasPermission,
  getPermissions,
  hasAnyRolePermission,
  roleCanAssign,
  roleCanSuspend,
} from './permissions'

export type { PermissionContext } from './context'
export { getPermissionContext, canPerformInChapter, requirePermission } from './context'
