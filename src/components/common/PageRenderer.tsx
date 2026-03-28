import type { ContentBlock } from '@/types'
import HeroBlock from '@/components/blocks/HeroBlock'
import TextBlock from '@/components/blocks/TextBlock'
import ImageBlock from '@/components/blocks/ImageBlock'
import CtaBlock from '@/components/blocks/CtaBlock'
import StatsBlock from '@/components/blocks/StatsBlock'
import EventListBlock from '@/components/blocks/EventListBlock'
import CoachListBlock from '@/components/blocks/CoachListBlock'
import TestimonialBlock from '@/components/blocks/TestimonialBlock'
import FaqBlock from '@/components/blocks/FaqBlock'
import ContactFormBlock from '@/components/blocks/ContactFormBlock'
import VideoBlock from '@/components/blocks/VideoBlock'
import TeamGridBlock from '@/components/blocks/TeamGridBlock'
import DividerBlock from '@/components/blocks/DividerBlock'

interface PageRendererProps {
  blocks: ContentBlock[]
  chapterId?: string | null
  accentColor?: string
  editMode?: boolean
}

/**
 * Renders a list of content blocks in the correct order.
 * Selects the appropriate display component for each block type.
 * Server Component — no client JS needed for display.
 */
export function PageRenderer({
  blocks,
  chapterId,
  accentColor,
  editMode = false,
}: PageRendererProps) {
  if (blocks.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p>No content yet.</p>
      </div>
    )
  }

  return (
    <div data-edit-mode={editMode ? 'true' : undefined}>
      {blocks.map((block) => {
        // Use published_version for display, fall back to content
        const displayContent = (block.published_version ?? block.content ?? {}) as Record<
          string,
          unknown
        >

        const commonProps = {
          content: displayContent,
          chapterId,
          accentColor,
          'data-block-id': editMode ? block.id : undefined,
          'data-editable': editMode ? 'true' : undefined,
        }

        switch (block.block_type) {
          case 'hero':
            return <HeroBlock key={block.id} {...commonProps} />
          case 'text':
            return <TextBlock key={block.id} content={displayContent} />
          case 'image':
            return <ImageBlock key={block.id} content={displayContent} />
          case 'cta':
            return <CtaBlock key={block.id} {...commonProps} />
          case 'stats':
            return <StatsBlock key={block.id} {...commonProps} />
          case 'event_list':
            return <EventListBlock key={block.id} content={displayContent} chapterId={chapterId} />
          case 'coach_list':
            return <CoachListBlock key={block.id} content={displayContent} chapterId={chapterId} />
          case 'testimonial':
            return <TestimonialBlock key={block.id} content={displayContent} />
          case 'faq':
            return <FaqBlock key={block.id} content={displayContent} />
          case 'contact_form':
            return <ContactFormBlock key={block.id} {...commonProps} />
          case 'video':
            return <VideoBlock key={block.id} content={displayContent} />
          case 'team_grid':
            return <TeamGridBlock key={block.id} content={displayContent} />
          case 'divider':
            return <DividerBlock key={block.id} content={displayContent} />
          default:
            return null
        }
      })}
    </div>
  )
}
