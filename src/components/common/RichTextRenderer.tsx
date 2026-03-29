/**
 * Server-rendered tiptap JSON content.
 * Converts tiptap's ProseMirror JSON to semantic HTML.
 * Zero client JS — pure server render.
 *
 * Security: DOMPurify is intentionally NOT used here. Instead, the renderer
 * constructs HTML structurally from a typed ProseMirror JSON document:
 *  - Text nodes are run through escapeHtml() before any markup is applied.
 *  - Only a known-safe allowlist of HTML tags is ever emitted (p, strong, em, a, h2, h3, ul, ol, li).
 *  - Link hrefs are validated to only allow http/https protocols.
 * No arbitrary HTML ever reaches dangerouslySetInnerHTML.
 * If a future use case requires rendering raw HTML strings, add DOMPurify (browser) at that point.
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
    // Escape raw text FIRST — prevents XSS when text contains HTML special chars.
    // Marks then wrap the already-safe string in known-safe tags only.
    let text = escapeHtml(node.text ?? '')

    // Apply marks (bold, italic, link)
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === 'bold') text = `<strong>${text}</strong>`
        if (mark.type === 'italic') text = `<em>${text}</em>`
        if (mark.type === 'link' && mark.attrs?.['href']) {
          const href = String(mark.attrs['href'])
          // Reject non-http(s) protocols (e.g. javascript:, data:) as a defence-in-depth layer
          const isExternal = href.startsWith('http://') || href.startsWith('https://')
          const isSafeRelative = !href.includes(':')
          if (isExternal || isSafeRelative) {
            const rel = isExternal ? ' rel="noopener noreferrer"' : ''
            const target = isExternal ? ' target="_blank"' : ''
            text = `<a href="${escapeHtml(href)}"${rel}${target}>${text}</a>`
          }
          // Silently drop links with unsafe protocols — text content is preserved
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
