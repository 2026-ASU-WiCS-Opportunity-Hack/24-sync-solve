'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Unlink,
  Check,
  X,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

interface RichTextEditorProps {
  /** tiptap JSON content */
  value?: Record<string, unknown>
  /** Called whenever content changes */
  onChange: (json: Record<string, unknown>) => void
  /** Disable editing */
  disabled?: boolean
  /** Accessible label for the editor */
  label?: string
}

/**
 * Headless tiptap rich text editor.
 * Outputs ProseMirror JSON compatible with RichTextRenderer.
 *
 * Supported formats: bold, italic, headings (h2/h3),
 *   bullet list, ordered list, links.
 * NO tables, embeds, or arbitrary HTML.
 */
/** Reject non-http(s) protocols to prevent javascript: and data: URI injection */
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith('//') ? `https:${url}` : url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    // Relative paths are fine
    return !url.includes(':') || url.startsWith('https://') || url.startsWith('http://')
  }
}

export function RichTextEditor({ value, onChange, disabled = false, label }: RichTextEditorProps) {
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false)
  const [linkUrlInput, setLinkUrlInput] = useState('')
  const linkInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Allow only h2 and h3
        heading: { levels: [2, 3] },
        // Disable these to keep output clean
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        code: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        // Reject non-http(s) protocols at the tiptap level
        validate: (href) => isSafeUrl(href),
      }),
    ],
    immediatelyRender: false,
    content: value ?? null,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON() as Record<string, unknown>)
    },
  })

  const openLinkPopover = useCallback(() => {
    if (!editor) return
    const previousUrl = (editor.getAttributes('link').href as string | undefined) ?? ''
    setLinkUrlInput(previousUrl)
    setLinkPopoverOpen(true)
    // Focus the input on next tick (after render)
    setTimeout(() => linkInputRef.current?.focus(), 0)
  }, [editor])

  const confirmLink = useCallback(() => {
    if (!editor) return
    const url = linkUrlInput.trim()
    setLinkPopoverOpen(false)
    setLinkUrlInput('')

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    if (!isSafeUrl(url)) return // Silently reject unsafe URLs

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor, linkUrlInput])

  const cancelLink = useCallback(() => {
    setLinkPopoverOpen(false)
    setLinkUrlInput('')
    editor?.chain().focus().run()
  }, [editor])

  if (!editor) return null

  return (
    <div
      className="overflow-hidden rounded-lg border border-gray-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/30"
      role="group"
      aria-label={label ?? 'Rich text editor'}
    >
      {/* Toolbar */}
      {!disabled && (
        <div
          className="flex flex-wrap gap-0.5 border-b border-gray-200 bg-gray-50 p-1.5"
          role="toolbar"
          aria-label="Text formatting"
        >
          <RteButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            aria-label="Bold"
            title="Bold"
          >
            <Bold size={13} aria-hidden="true" />
          </RteButton>
          <RteButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            aria-label="Italic"
            title="Italic"
          >
            <Italic size={13} aria-hidden="true" />
          </RteButton>

          <div className="mx-1 h-5 w-px self-center bg-gray-300" aria-hidden="true" />

          <RteButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            aria-label="Heading 2"
            title="Heading 2"
          >
            <Heading2 size={13} aria-hidden="true" />
          </RteButton>
          <RteButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            aria-label="Heading 3"
            title="Heading 3"
          >
            <Heading3 size={13} aria-hidden="true" />
          </RteButton>

          <div className="mx-1 h-5 w-px self-center bg-gray-300" aria-hidden="true" />

          <RteButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            aria-label="Bullet list"
            title="Bullet list"
          >
            <List size={13} aria-hidden="true" />
          </RteButton>
          <RteButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            aria-label="Ordered list"
            title="Numbered list"
          >
            <ListOrdered size={13} aria-hidden="true" />
          </RteButton>

          <div className="mx-1 h-5 w-px self-center bg-gray-300" aria-hidden="true" />

          <div className="relative">
            <RteButton
              onClick={openLinkPopover}
              isActive={editor.isActive('link') || linkPopoverOpen}
              aria-label="Add link"
              aria-expanded={linkPopoverOpen}
              aria-haspopup="dialog"
              title="Link"
            >
              <Link2 size={13} aria-hidden="true" />
            </RteButton>

            {/* Inline accessible link URL popover */}
            {linkPopoverOpen && (
              <div
                role="dialog"
                aria-label="Enter link URL"
                className="absolute inset-s-0 top-full z-10 mt-1 flex w-64 items-center gap-1 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') cancelLink()
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmLink()
                  }
                }}
              >
                <input
                  ref={linkInputRef}
                  type="url"
                  value={linkUrlInput}
                  onChange={(e) => setLinkUrlInput(e.target.value)}
                  placeholder="https://example.com"
                  aria-label="Link URL"
                  className="min-w-0 flex-1 rounded px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={confirmLink}
                  aria-label="Confirm link"
                  className="rounded p-1 text-green-600 hover:bg-green-50 focus:ring-2 focus:ring-green-400 focus:outline-none"
                >
                  <Check size={13} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={cancelLink}
                  aria-label="Cancel"
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 focus:outline-none"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {editor.isActive('link') && (
            <RteButton
              onClick={() => editor.chain().focus().unsetLink().run()}
              isActive={false}
              aria-label="Remove link"
              title="Remove link"
            >
              <Unlink size={13} aria-hidden="true" />
            </RteButton>
          )}
        </div>
      )}

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className={[
          'prose-sm prose max-w-none px-3 py-2',
          '[&_.ProseMirror]:min-h-20',
          '[&_.ProseMirror]:outline-none',
          disabled ? 'bg-gray-50 opacity-70' : 'bg-white',
        ].join(' ')}
      />
    </div>
  )
}

interface RteButtonProps {
  onClick: () => void
  isActive: boolean
  'aria-label': string
  'aria-expanded'?: boolean
  'aria-haspopup'?: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid' | boolean
  title: string
  children: React.ReactNode
}

function RteButton({
  onClick,
  isActive,
  'aria-label': ariaLabel,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHaspopup,
  title,
  children,
}: RteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaHaspopup ? undefined : isActive}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      title={title}
      className={[
        'rounded p-1.5 text-gray-600 transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none',
        isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
