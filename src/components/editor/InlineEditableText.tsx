'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useEditMode } from '@/features/content/hooks/useEditMode'
import type { ActionResult } from '@/types'

type AllowedTag = 'p' | 'span' | 'h2' | 'h3' | 'h4'

interface InlineEditableTextProps {
  /** Current persisted value (from server) */
  value: string
  /**
   * Server action bound to the appropriate key/record.
   * Receives the new value and returns ActionResult.
   * Pass as a bound server action, e.g.:
   *   updateGlobalSetting.bind(null, 'footer.tagline')
   */
  onSave: (value: string) => Promise<ActionResult>
  /** Whether the current user is super_admin (resolved server-side) */
  isSuperAdmin: boolean
  /** HTML element to render as when not editing */
  as?: AllowedTag
  /** Class names applied to the rendered element and the edit button */
  className?: string
  /** aria-label for the edit trigger button */
  label?: string
}

/**
 * Renders text that super admins can click to edit inline when edit mode is active.
 * Chapter leads and unauthenticated users see the text rendered normally.
 *
 * The `onSave` prop MUST be a server action (or bound server action).
 * The server action is responsible for auth checks — this component does
 * not perform client-side auth beyond checking `isSuperAdmin`.
 */
export function InlineEditableText({
  value,
  onSave,
  isSuperAdmin,
  as: Tag = 'span',
  className = '',
  label,
}: InlineEditableTextProps) {
  const { isEditMode } = useEditMode()
  const [currentValue, setCurrentValue] = useState(value)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync server-side prop changes (after revalidatePath refreshes the page)
  useEffect(() => {
    setCurrentValue(value)
  }, [value])

  // Auto-focus textarea when edit panel opens
  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }
  }, [isEditing])

  const canEdit = isEditMode && isSuperAdmin

  function openEditor() {
    setDraft(currentValue)
    setIsEditing(true)
  }

  function cancelEdit() {
    setIsEditing(false)
    setDraft(currentValue)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      cancelEdit()
    }
    // Shift+Enter = newline; plain Enter = save
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  function handleSave() {
    const trimmed = draft.trim()
    if (!trimmed) {
      toast.error('Value cannot be empty.')
      return
    }
    startTransition(async () => {
      const result = await onSave(trimmed)
      if (result.success) {
        setCurrentValue(trimmed)
        setIsEditing(false)
        toast.success('Saved.')
      } else {
        toast.error(result.error ?? 'Save failed. Please try again.')
      }
    })
  }

  // ── Non-editable render ───────────────────────────────────────────────────
  if (!canEdit) {
    return <Tag className={className}>{currentValue}</Tag>
  }

  // ── Edit mode: editing state ──────────────────────────────────────────────
  if (isEditing) {
    return (
      <div
        className="relative inline-block w-full max-w-sm"
        role="group"
        aria-label={`Editing: ${label ?? 'text'}`}
      >
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={isPending}
          className="w-full resize-none rounded border-2 border-blue-400 bg-white/10 px-2 py-1 text-sm leading-relaxed text-inherit placeholder-white/40 focus:ring-2 focus:ring-blue-300 focus:outline-none disabled:opacity-60"
          aria-label={label ?? 'Edit text'}
        />
        <div className="mt-1 flex gap-1.5">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1 rounded bg-blue-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-60"
            aria-label="Save"
          >
            <Check size={12} aria-hidden="true" />
            {isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            disabled={isPending}
            className="flex items-center gap-1 rounded bg-white/20 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/30 disabled:opacity-60"
            aria-label="Cancel"
          >
            <X size={12} aria-hidden="true" />
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── Edit mode: trigger button ─────────────────────────────────────────────
  return (
    <button
      type="button"
      onClick={openEditor}
      className={[
        className,
        'group relative cursor-pointer rounded border-2 border-dashed border-blue-400/60 px-1',
        'transition-colors hover:border-blue-400 hover:bg-blue-400/10',
        'focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:outline-none',
        'focus:ring-offset-transparent',
      ].join(' ')}
      title="Click to edit"
      aria-label={`Edit: ${label ?? currentValue}`}
    >
      {currentValue}
      <span
        className="absolute -top-1 -right-1 hidden size-4 items-center justify-center rounded-full bg-blue-500 group-hover:flex"
        aria-hidden="true"
      >
        <Pencil size={9} className="text-white" />
      </span>
    </button>
  )
}
