'use client'

import { useContext } from 'react'
import { EditModeContext } from '@/components/editor/EditModeProvider'

/**
 * Access the current edit mode state.
 * Must be used inside <EditModeProvider>.
 */
export function useEditMode() {
  const ctx = useContext(EditModeContext)
  if (!ctx) {
    throw new Error('useEditMode must be used within <EditModeProvider>')
  }
  return ctx
}
