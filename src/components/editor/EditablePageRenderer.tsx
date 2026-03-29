'use client'

import { useState } from 'react'
import { useEditMode } from '@/features/content/hooks/useEditMode'
import { BlockWrapper } from '@/components/editor/BlockWrapper'
import HeroBlock from '@/components/blocks/HeroBlock'
import TextBlock from '@/components/blocks/TextBlock'
import ImageBlock from '@/components/blocks/ImageBlock'
import CtaBlock from '@/components/blocks/CtaBlock'
import StatsBlock from '@/components/blocks/StatsBlock'
import TestimonialBlock from '@/components/blocks/TestimonialBlock'
import FaqBlock from '@/components/blocks/FaqBlock'
import ContactFormBlock from '@/components/blocks/ContactFormBlock'
import VideoBlock from '@/components/blocks/VideoBlock'
import TeamGridBlock from '@/components/blocks/TeamGridBlock'
import DividerBlock from '@/components/blocks/DividerBlock'
import type { ClientBlock } from '@/features/content/types'
import type { ContentBlock } from '@/types'

// NOTE: CoachListBlock and EventListBlock are intentionally NOT imported here.
// They are async Server Components that use `next/headers` via `createClient()`.
// They are pre-rendered on the server and passed via `serverRenderedBlocks`.

interface EditablePageRendererProps {
  initialBlocks: ContentBlock[]
  pageId: string
  chapterId?: string | null
  accentColor?: string
  /**
   * Pre-rendered React nodes for blocks that require server-side data fetching
   * (coach_list, event_list). Keyed by block ID.
   * Passed from the server component wrapper to avoid importing server-only modules.
   */
  serverRenderedBlocks?: Record<string, React.ReactNode>
}

/**
 * Client component that renders content blocks with optional edit mode UI.
 *
 * For most block types: renders them directly (all pure display components).
 * For coach_list / event_list: uses pre-rendered server nodes from `serverRenderedBlocks`
 *   to avoid importing server-only `createClient()`.
 *
 * When edit mode is OFF: identical output to PageRenderer.
 * When edit mode is ON: wraps each block in BlockWrapper with toolbar + editor modal.
 */
export function EditablePageRenderer({
  initialBlocks,
  pageId,
  chapterId,
  accentColor,
  serverRenderedBlocks = {},
}: EditablePageRendererProps) {
  const { isEditMode } = useEditMode()
  const [blocks, setBlocks] = useState<ClientBlock[]>(initialBlocks as ClientBlock[])

  function handleOptimisticUpdate(blockId: string, content: Record<string, unknown>) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, _localContent: content, _isPendingSave: true } : b
      )
    )
  }

  function handleBlocksChange(updated: ClientBlock[]) {
    setBlocks(updated)
  }

  if (blocks.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p>No content yet.</p>
      </div>
    )
  }

  const displayBlocks = isEditMode
    ? blocks
    : blocks.filter((b) => b.is_visible && (b.status === 'published' || b.status === 'rejected'))

  return (
    <div data-edit-mode={isEditMode ? 'true' : undefined}>
      {displayBlocks.map((block, index) => {
        const displayContent = (block._localContent ??
          block.published_version ??
          block.content ??
          {}) as Record<string, unknown>

        const blockElement = renderBlock(
          block,
          displayContent,
          chapterId,
          accentColor,
          serverRenderedBlocks
        )
        if (!blockElement) return null

        if (isEditMode) {
          return (
            <BlockWrapper
              key={block.id}
              block={block}
              pageId={pageId}
              allBlocks={blocks}
              isFirst={index === 0}
              isLast={index === displayBlocks.length - 1}
              onBlocksChange={handleBlocksChange}
              onOptimisticUpdate={handleOptimisticUpdate}
            >
              {blockElement}
            </BlockWrapper>
          )
        }

        return blockElement
      })}
    </div>
  )
}

function renderBlock(
  block: ClientBlock,
  content: Record<string, unknown>,
  chapterId: string | null | undefined,
  accentColor: string | undefined,
  serverRenderedBlocks: Record<string, React.ReactNode>
): React.ReactElement | null {
  switch (block.block_type) {
    case 'hero':
      return <HeroBlock key={block.id} content={content} accentColor={accentColor} />
    case 'text':
      return <TextBlock key={block.id} content={content} />
    case 'image':
      return <ImageBlock key={block.id} content={content} />
    case 'cta':
      return <CtaBlock key={block.id} content={content} accentColor={accentColor} />
    case 'stats':
      return <StatsBlock key={block.id} content={content} accentColor={accentColor} />
    case 'testimonial':
      return <TestimonialBlock key={block.id} content={content} />
    case 'faq':
      return <FaqBlock key={block.id} content={content} />
    case 'contact_form':
      return <ContactFormBlock key={block.id} content={content} accentColor={accentColor} />
    case 'video':
      return <VideoBlock key={block.id} content={content} />
    case 'team_grid':
      return <TeamGridBlock key={block.id} content={content} />
    case 'divider':
      return <DividerBlock key={block.id} content={content} />

    // Data-fetching blocks: use pre-rendered server node or null
    case 'coach_list':
    case 'event_list': {
      const serverNode = serverRenderedBlocks[block.id]
      if (!serverNode) return null
      // Wrap in a keyed fragment to satisfy React's reconciliation
      return (
        <div key={block.id} data-block-type={block.block_type}>
          {serverNode}
        </div>
      )
    }

    default:
      return null
  }
}
