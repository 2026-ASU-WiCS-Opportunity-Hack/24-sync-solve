'use client'

import { createContext, useState, useCallback, useEffect } from 'react'
import type { EditModeState } from '@/features/content/types'

export const EditModeContext = createContext<EditModeState | null>(null)

interface EditModeProviderProps {
  children: React.ReactNode
  /** Whether the current user has permission to enter edit mode */
  canEdit: boolean
  /** Chapter ID for scoping edits */
  chapterId: string | null
}

/**
 * Provides edit mode state to all descendants.
 * Only enables edit mode when canEdit=true.
 */
export function EditModeProvider({ children, canEdit, chapterId }: EditModeProviderProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const setEditMode = useCallback(
    (value: boolean) => {
      if (!canEdit) return

      if (!value && isDirty) {
        // Prompt before exiting with unsaved changes
        const confirmed = window.confirm('Exit edit mode? Any unsaved changes will be lost.')
        if (!confirmed) return
      }

      setIsEditMode(value)
      if (!value) {
        setIsDirty(false)
      }
    },
    [canEdit, isDirty]
  )

  // Warn on page unload if there are unsaved changes
  useEffect(() => {
    if (!isDirty) return

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const value: EditModeState = {
    isEditMode: canEdit ? isEditMode : false,
    isDirty,
    chapterId,
    setEditMode,
    setIsDirty,
  }

  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>
}
