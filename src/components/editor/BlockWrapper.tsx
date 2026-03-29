'use client'

import { useState, useTransition } from 'react'
import { BlockToolbar } from '@/components/editor/BlockToolbar'
import { BlockEditorModal } from '@/components/editor/BlockEditorModal'
import { reorderBlocks } from '@/features/content/actions/reorderBlocks'
import { toggleBlockVisibility } from '@/features/content/actions/toggleBlockVisibility'
import { BLOCK_REGISTRY } from '@/features/content/blocks/registry'
import type { ClientBlock } from '@/features/content/types'
import type { BlockType } from '@/types'
import { toast } from 'sonner'

interface BlockWrapperProps {
  block: ClientBlock
  pageId: string
  allBlocks: ClientBlock[]
  isFirst: boolean
  isLast: boolean
  onBlocksChange: (blocks: ClientBlock[]) => void
  onOptimisticUpdate: (blockId: string, content: Record<string, unknown>) => void
  children: React.ReactNode
}

/**
 * Wraps a block with edit-mode UI:
 * - Blue dashed border to indicate editability
 * - BlockToolbar on hover (Edit / Move / Show/Hide)
 * - Opens BlockEditorModal on edit click
 * - Dimmed overlay for hidden blocks
 */
export function BlockWrapper({
  block,
  pageId,
  allBlocks,
  isFirst,
  isLast,
  onBlocksChange,
  onOptimisticUpdate,
  children,
}: BlockWrapperProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isSaving, startTransition] = useTransition()

  const blockType = block.block_type as BlockType
  const registryEntry = BLOCK_REGISTRY[blockType]

  function handleMoveUp() {
    if (isFirst) return
    const idx = allBlocks.findIndex((b) => b.id === block.id)
    if (idx <= 0) return

    const updated = [...allBlocks]
    const prev = updated[idx - 1]
    const curr = updated[idx]
    if (!prev || !curr) return
    updated[idx - 1] = curr
    updated[idx] = prev

    const reordered = updated.map((b, i) => ({ ...b, sort_order: i }))
    onBlocksChange(reordered)

    startTransition(async () => {
      const result = await reorderBlocks(
        pageId,
        reordered.map((b) => ({ id: b.id, sort_order: b.sort_order }))
      )
      if (!result.success) {
        toast.error(result.error ?? 'Failed to reorder.')
        onBlocksChange(allBlocks) // revert
      }
    })
  }

  function handleMoveDown() {
    if (isLast) return
    const idx = allBlocks.findIndex((b) => b.id === block.id)
    if (idx >= allBlocks.length - 1) return

    const updated = [...allBlocks]
    const next = updated[idx + 1]
    const curr = updated[idx]
    if (!next || !curr) return
    updated[idx + 1] = curr
    updated[idx] = next

    const reordered = updated.map((b, i) => ({ ...b, sort_order: i }))
    onBlocksChange(reordered)

    startTransition(async () => {
      const result = await reorderBlocks(
        pageId,
        reordered.map((b) => ({ id: b.id, sort_order: b.sort_order }))
      )
      if (!result.success) {
        toast.error(result.error ?? 'Failed to reorder.')
        onBlocksChange(allBlocks) // revert
      }
    })
  }

  function handleToggleVisibility() {
    const newVisibility = !block.is_visible
    // Optimistic update
    onBlocksChange(
      allBlocks.map((b) => (b.id === block.id ? { ...b, is_visible: newVisibility } : b))
    )

    startTransition(async () => {
      const result = await toggleBlockVisibility(block.id, newVisibility)
      if (!result.success) {
        toast.error(result.error ?? 'Failed to update visibility.')
        onBlocksChange(allBlocks) // revert
      }
    })
  }

  return (
    <>
      <div
        className={[
          'relative border-2 border-dashed transition-all',
          block.is_visible ? 'border-blue-400' : 'border-gray-300 opacity-50',
        ].join(' ')}
        data-block-id={block.id}
        data-block-type={blockType}
      >
        {/* Toolbar */}
        <BlockToolbar
          isVisible={block.is_visible}
          isFirst={isFirst}
          isLast={isLast}
          isSaving={isSaving}
          status={block.status}
          requiresApproval={registryEntry?.requiresApproval ?? false}
          onEdit={() => setIsEditorOpen(true)}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onToggleVisibility={handleToggleVisibility}
        />

        {/* Block content */}
        <div className={block.is_visible ? '' : 'pointer-events-none select-none'}>{children}</div>

        {/* Hidden overlay */}
        {!block.is_visible && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gray-100/60"
            aria-hidden="true"
          >
            <span className="rounded-full bg-gray-600 px-3 py-1 text-xs font-semibold text-white">
              Hidden
            </span>
          </div>
        )}
      </div>

      {/* Editor modal */}
      {isEditorOpen && (
        <BlockEditorModal
          block={block}
          onClose={() => setIsEditorOpen(false)}
          onOptimisticUpdate={onOptimisticUpdate}
        />
      )}
    </>
  )
}
