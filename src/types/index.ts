/**
 * Application-level TypeScript types.
 * Database types are in database.ts (auto-generated).
 */

export type {
  Database,
  Json,
  UserRole,
  CertificationLevel,
  ContentStatus,
  BlockType,
  PaymentType,
  PaymentStatus,
  EventType,
} from './database'

// ============================================================
// Domain types (derived from DB rows, with richer shapes)
// ============================================================

import type { Database, UserRole } from './database'

export type Chapter = Database['public']['Tables']['chapters']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type CoachProfile = Database['public']['Tables']['coach_profiles']['Row']
export type Page = Database['public']['Tables']['pages']['Row']
export type ContentBlock = Database['public']['Tables']['content_blocks']['Row']
export type ContentVersion = Database['public']['Tables']['content_versions']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']

/** Coach with profile joined */
export interface CoachWithProfile extends CoachProfile {
  profile: Pick<Profile, 'email' | 'full_name' | 'avatar_url'>
}

/** Chapter context — available throughout [chapter] routes */
export interface ChapterContext {
  chapter: Chapter
  accentColor: string
}

/** Authenticated user with role info */
export interface AuthUser {
  id: string
  email: string
  role: UserRole
  chapterId: string | null
  fullName: string | null
  avatarUrl: string | null
}

/** Content block with its page context */
export interface ContentBlockWithPage extends ContentBlock {
  page: Page
}

/** Pagination result */
export interface PaginatedResult<T> {
  items: T[]
  nextCursor: string | null
  totalCount?: number
}

/** Form action result — standardized server action return type */
export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/** SEO metadata */
export interface PageMetadata {
  title: string
  description: string
  ogImage?: string
  canonical?: string
}
