'use client'

import { Pencil, Eye } from 'lucide-react'
import { useEditMode } from '@/features/content/hooks/useEditMode'

/**
 * Floating action button (bottom-right) that toggles edit mode.
 * Only rendered when the user has canEdit permission (enforced by EditModeProvider).
 */
export function EditModeToggle() {
  const { isEditMode, setEditMode, isDirty } = useEditMode()

  return (
    <div
      className="fixed end-6 bottom-6 z-50 flex flex-col items-end gap-2"
      role="region"
      aria-label="Edit mode controls"
    >
      {/* Dirty indicator */}
      {isEditMode && isDirty && (
        <span
          role="status"
          aria-live="polite"
          className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow-lg"
        >
          Unsaved changes
        </span>
      )}

      <button
        type="button"
        onClick={() => setEditMode(!isEditMode)}
        aria-pressed={isEditMode}
        aria-label={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
        className={[
          'flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-xl',
          'transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none',
          isEditMode
            ? 'bg-wial-navy focus:ring-wial-navy text-white hover:opacity-90'
            : 'bg-white text-gray-800 ring-1 ring-gray-300 hover:bg-gray-50 focus:ring-gray-400',
        ].join(' ')}
      >
        {isEditMode ? (
          <>
            <Eye size={15} aria-hidden="true" />
            Preview
          </>
        ) : (
          <>
            <Pencil size={15} aria-hidden="true" />
            Edit Mode
          </>
        )}
      </button>
    </div>
  )
}
