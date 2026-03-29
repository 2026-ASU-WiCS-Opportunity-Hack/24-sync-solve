'use client'

import { Pencil, ChevronUp, ChevronDown, Eye, EyeOff, Loader2 } from 'lucide-react'

interface BlockToolbarProps {
  isVisible: boolean
  isFirst: boolean
  isLast: boolean
  isSaving: boolean
  status: string
  requiresApproval: boolean
  onEdit: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleVisibility: () => void
}

/**
 * Inline toolbar rendered above each block in edit mode.
 * Provides edit, move up/down, and show/hide controls.
 */
export function BlockToolbar({
  isVisible,
  isFirst,
  isLast,
  isSaving,
  status,
  requiresApproval,
  onEdit,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
}: BlockToolbarProps) {
  return (
    <div
      className="flex items-center justify-between gap-2 bg-gray-900/90 px-2 py-1.5"
      role="toolbar"
      aria-label="Block controls"
    >
      {/* Status badge */}
      <div className="flex items-center gap-1.5">
        {status === 'pending_approval' && (
          <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            Pending approval
          </span>
        )}
        {requiresApproval && status !== 'pending_approval' && (
          <span className="rounded bg-blue-500/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            Requires approval
          </span>
        )}
        {!requiresApproval && (
          <span className="rounded bg-green-600/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            Instant publish
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton onClick={onEdit} aria-label="Edit block" title="Edit" disabled={isSaving}>
          {isSaving ? (
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          ) : (
            <Pencil size={13} aria-hidden="true" />
          )}
          <span className="hidden sm:inline">Edit</span>
        </ToolbarButton>

        <ToolbarButton
          onClick={onMoveUp}
          aria-label="Move block up"
          title="Move up"
          disabled={isFirst || isSaving}
        >
          <ChevronUp size={13} aria-hidden="true" />
        </ToolbarButton>

        <ToolbarButton
          onClick={onMoveDown}
          aria-label="Move block down"
          title="Move down"
          disabled={isLast || isSaving}
        >
          <ChevronDown size={13} aria-hidden="true" />
        </ToolbarButton>

        <ToolbarButton
          onClick={onToggleVisibility}
          aria-label={isVisible ? 'Hide block' : 'Show block'}
          title={isVisible ? 'Hide' : 'Show'}
          disabled={isSaving}
        >
          {isVisible ? (
            <EyeOff size={13} aria-hidden="true" />
          ) : (
            <Eye size={13} aria-hidden="true" />
          )}
        </ToolbarButton>
      </div>
    </div>
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  'aria-label': string
  title: string
  disabled?: boolean
  children: React.ReactNode
}

function ToolbarButton({
  onClick,
  'aria-label': ariaLabel,
  title,
  disabled = false,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      className="flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-white/90 transition-colors hover:bg-white/20 focus:ring-1 focus:ring-white/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}
