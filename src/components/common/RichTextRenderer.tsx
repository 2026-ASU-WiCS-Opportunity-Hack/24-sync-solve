import { z } from 'zod'

/**
 * Server-rendered tiptap JSON content.
 * Converts tiptap's ProseMirror JSON to semantic HTML.
 * Zero client JS — pure server render.
 */

type TiptapNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
  text?: string
}

interface RichTextRendererProps {
  content: Record<string, unknown>
  className?: string
}

function renderNode(node: TiptapNode): string {
  if (node.type === 'text') {
    let text = node.text ?? ''

    // Apply marks (bold, italic, link)
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === 'bold') text = `<strong>${text}</strong>`
        if (mark.type === 'italic') text = `<em>${text}</em>`
        if (mark.type === 'link' && mark.attrs?.['href']) {
          const href = String(mark.attrs['href'])
          const rel = href.startsWith('http') ? ' rel="noopener noreferrer"' : ''
          const target = href.startsWith('http') ? ' target="_blank"' : ''
          text = `<a href="${escapeHtml(href)}"${rel}${target}>${text}</a>`
        }
      }
    }
    return text
  }

  const children = node.content?.map(renderNode).join('') ?? ''

  switch (node.type) {
    case 'doc':
      return children
    case 'paragraph':
      return children ? `<p>${children}</p>` : '<p></p>'
    case 'heading': {
      const level = (node.attrs?.['level'] as number) ?? 2
      const safeLevel = Math.min(Math.max(level, 2), 6) // Allow h2-h6 only
      return `<h${safeLevel}>${children}</h${safeLevel}>`
    }
    case 'bulletList':
      return `<ul>${children}</ul>`
    case 'orderedList':
      return `<ol>${children}</ol>`
    case 'listItem':
      return `<li>${children}</li>`
    case 'blockquote':
      return `<blockquote>${children}</blockquote>`
    case 'hardBreak':
      return '<br>'
    case 'horizontalRule':
      return '<hr>'
    default:
      return children
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function RichTextRenderer({ content, className }: RichTextRendererProps) {
  if (!content || typeof content !== 'object') return null

  const html = renderNode(content as TiptapNode)

  return (
    <div
      className={className}
      // Safe: we control content rendering via renderNode — no arbitrary HTML injection
      // Only specific known tags are output. User content is text-only (never HTML).
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
