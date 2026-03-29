import type { ContentBlock, ContentStatus, BlockType } from '@/types'

// ============================================================
// Edit mode
// ============================================================

export interface EditModeState {
  /** Whether edit mode is currently active */
  isEditMode: boolean
  /** Whether there are unsaved changes in the current session */
  isDirty: boolean
  /** The chapter this edit session belongs to (used for RLS checks) */
  chapterId: string | null
  /** Toggle edit mode on/off */
  setEditMode: (value: boolean) => void
  /** Mark current session as dirty */
  setIsDirty: (value: boolean) => void
}

// ============================================================
// Block editor
// ============================================================

/** Props shared by all block editor components */
export interface BlockEditorProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Current block content */
  initialContent: T
  /** Called when user saves the form — receives validated content */
  onSave: (content: T) => Promise<void>
  /** Called when user cancels editing */
  onCancel: () => void
  /** Whether a save is in progress */
  isSaving: boolean
}

// ============================================================
// Block state for client-side optimistic updates
// ============================================================

export interface ClientBlock extends ContentBlock {
  /** Optimistic local state — overrides DB data during in-flight saves */
  _localContent?: Record<string, unknown>
  /** Whether this block has a pending local save */
  _isPendingSave?: boolean
}

// ============================================================
// Block action results
// ============================================================

export interface BlockUpdateResult {
  success: boolean
  error?: string
  /** The new status after update */
  status?: ContentStatus
  /** Whether admin approval is needed */
  requiresApproval?: boolean
}

// ============================================================
// Block reorder payload
// ============================================================

export interface BlockReorderItem {
  id: string
  sort_order: number
}

// ============================================================
// Content version for revert UI
// ============================================================

export interface ContentVersionSummary {
  id: string
  version_number: number
  status: ContentStatus
  changed_by: string | null
  created_at: string
  /** Truncated preview of the content */
  preview: string
}

// ============================================================
// Approval item (extended for admin UI)
// ============================================================

export interface ApprovalDiff {
  blockId: string
  blockType: BlockType
  pageTitle: string
  chapterName: string | null
  chapterSlug: string | null
  published: Record<string, unknown> | null
  draft: Record<string, unknown>
  updatedAt: string
}
