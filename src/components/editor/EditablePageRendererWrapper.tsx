import CoachListBlock from '@/components/blocks/CoachListBlock'
import EventListBlock from '@/components/blocks/EventListBlock'
import { EditablePageRenderer } from '@/components/editor/EditablePageRenderer'
import type { ContentBlock } from '@/types'

interface EditablePageRendererWrapperProps {
  initialBlocks: ContentBlock[]
  pageId: string
  chapterId?: string | null
  accentColor?: string
}

/**
 * Server Component wrapper for EditablePageRenderer.
 *
 * CoachListBlock and EventListBlock are async Server Components that call
 * `createClient()` (which uses `next/headers`). They cannot be imported or
 * rendered inside a Client Component.
 *
 * This wrapper pre-renders those blocks on the server, then passes the resulting
 * React nodes to the Client Component via `serverRenderedBlocks`. This is the
 * standard RSC "server components as children" pattern.
 *
 * All pages should import THIS wrapper, not EditablePageRenderer directly.
 */
export async function EditablePageRendererWrapper({
  initialBlocks,
  pageId,
  chapterId,
  accentColor,
}: EditablePageRendererWrapperProps) {
  const serverRenderedBlocks: Record<string, React.ReactNode> = {}

  for (const block of initialBlocks) {
    // Use published_version for display (same logic as the client renderer)
    const displayContent = (block.published_version ?? block.content ?? {}) as Record<
      string,
      unknown
    >

    if (block.block_type === 'coach_list') {
      serverRenderedBlocks[block.id] = (
        <CoachListBlock content={displayContent} chapterId={chapterId ?? null} />
      )
    }

    if (block.block_type === 'event_list') {
      serverRenderedBlocks[block.id] = (
        <EventListBlock content={displayContent} chapterId={chapterId ?? null} />
      )
    }
  }

  return (
    <EditablePageRenderer
      initialBlocks={initialBlocks}
      pageId={pageId}
      chapterId={chapterId}
      accentColor={accentColor}
      serverRenderedBlocks={serverRenderedBlocks}
    />
  )
}
