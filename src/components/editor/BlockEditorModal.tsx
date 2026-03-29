'use client'

import { useState, useTransition, lazy, Suspense } from 'react'
import { X, Loader2, History } from 'lucide-react'
import { updateBlock } from '@/features/content/actions/updateBlock'
import { useEditMode } from '@/features/content/hooks/useEditMode'
import { BLOCK_REGISTRY } from '@/features/content/blocks/registry'
import { BlockVersionHistory } from '@/components/editor/BlockVersionHistory'
import type { ClientBlock } from '@/features/content/types'
import type { BlockType } from '@/types'

// Dynamically import all block editors to keep initial bundle small
const EDITORS: Record<
  BlockType,
  React.LazyExoticComponent<React.ComponentType<BlockEditorInnerProps>>
> = {
  hero: lazy(() =>
    import('@/components/editor/blocks/HeroBlockEditor').then((m) => ({
      default: m.HeroBlockEditor,
    }))
  ),
  text: lazy(() =>
    import('@/components/editor/blocks/TextBlockEditor').then((m) => ({
      default: m.TextBlockEditor,
    }))
  ),
  image: lazy(() =>
    import('@/components/editor/blocks/ImageBlockEditor').then((m) => ({
      default: m.ImageBlockEditor,
    }))
  ),
  cta: lazy(() =>
    import('@/components/editor/blocks/CtaBlockEditor').then((m) => ({ default: m.CtaBlockEditor }))
  ),
  stats: lazy(() =>
    import('@/components/editor/blocks/StatsBlockEditor').then((m) => ({
      default: m.StatsBlockEditor,
    }))
  ),
  event_list: lazy(() =>
    import('@/components/editor/blocks/EventListBlockEditor').then((m) => ({
      default: m.EventListBlockEditor,
    }))
  ),
  coach_list: lazy(() =>
    import('@/components/editor/blocks/CoachListBlockEditor').then((m) => ({
      default: m.CoachListBlockEditor,
    }))
  ),
  testimonial: lazy(() =>
    import('@/components/editor/blocks/TestimonialBlockEditor').then((m) => ({
      default: m.TestimonialBlockEditor,
    }))
  ),
  faq: lazy(() =>
    import('@/components/editor/blocks/FaqBlockEditor').then((m) => ({ default: m.FaqBlockEditor }))
  ),
  contact_form: lazy(() =>
    import('@/components/editor/blocks/ContactFormBlockEditor').then((m) => ({
      default: m.ContactFormBlockEditor,
    }))
  ),
  video: lazy(() =>
    import('@/components/editor/blocks/VideoBlockEditor').then((m) => ({
      default: m.VideoBlockEditor,
    }))
  ),
  team_grid: lazy(() =>
    import('@/components/editor/blocks/TeamGridBlockEditor').then((m) => ({
      default: m.TeamGridBlockEditor,
    }))
  ),
  divider: lazy(() =>
    import('@/components/editor/blocks/DividerBlockEditor').then((m) => ({
      default: m.DividerBlockEditor,
    }))
  ),
  client_grid: lazy(() =>
    import('@/components/editor/blocks/ClientGridBlockEditor').then((m) => ({
      default: m.ClientGridBlockEditor,
    }))
  ),
}

export interface BlockEditorInnerProps {
  initialContent: Record<string, unknown>
  onSave: (content: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  isSaving: boolean
}

interface BlockEditorModalProps {
  block: ClientBlock
  onClose: () => void
  onOptimisticUpdate: (blockId: string, content: Record<string, unknown>) => void
}

/**
 * Modal wrapper that loads the correct editor for a given block type.
 * Handles save/cancel lifecycle and optimistic updates.
 */
export function BlockEditorModal({ block, onClose, onOptimisticUpdate }: BlockEditorModalProps) {
  const { setIsDirty } = useEditMode()
  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'edit' | 'history'>('edit')

  const blockType = block.block_type as BlockType
  const EditorComponent = EDITORS[blockType]
  const registryEntry = BLOCK_REGISTRY[blockType]
  const displayContent = (block.published_version ?? block.content ?? {}) as Record<string, unknown>

  async function handleSave(content: Record<string, unknown>) {
    setSaveError(null)

    // Optimistic update for instant feedback
    onOptimisticUpdate(block.id, content)

    startTransition(async () => {
      const result = await updateBlock(block.id, content)

      if (!result.success) {
        setSaveError(result.error ?? 'Save failed.')
        // Revert optimistic update
        onOptimisticUpdate(block.id, displayContent)
        return
      }

      setIsDirty(true)
      onClose()
    })
  }

  // Trap focus within modal (basic implementation — HeroUI modal would handle this)
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${registryEntry?.label ?? blockType} block`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-5 pt-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Edit {registryEntry?.label ?? blockType}
              </h2>
              {registryEntry?.requiresApproval && activeTab === 'edit' && (
                <p className="mt-0.5 text-xs text-amber-600">
                  Changes require admin approval before publishing
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close editor"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:ring-2 focus:ring-gray-300 focus:outline-none"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Tabs */}
          <div className="-mb-px flex gap-4" role="tablist" aria-label="Editor tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'edit'}
              aria-controls="tab-edit"
              onClick={() => setActiveTab('edit')}
              className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                activeTab === 'edit'
                  ? 'border-wial-navy text-wial-navy'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              aria-controls="tab-history"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 border-b-2 pb-2 text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'border-wial-navy text-wial-navy'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <History size={14} aria-hidden="true" />
              History
            </button>
          </div>
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'edit' ? (
            <>
              {saveError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {saveError}
                </div>
              )}

              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={20} className="animate-spin text-gray-400" aria-hidden="true" />
                    <span className="sr-only">Loading editor…</span>
                  </div>
                }
              >
                <EditorComponent
                  initialContent={displayContent}
                  onSave={handleSave}
                  onCancel={onClose}
                  isSaving={isPending}
                />
              </Suspense>
            </>
          ) : (
            <div id="tab-history" role="tabpanel" aria-label="Version history">
              <BlockVersionHistory
                blockId={block.id}
                onReverted={() => {
                  setIsDirty(true)
                  onClose()
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
