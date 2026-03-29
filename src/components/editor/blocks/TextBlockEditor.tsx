'use client'

import { useState } from 'react'
import { textBlockSchema, type TextBlockContent } from '@/features/content/blocks/schemas'
import { Field, Input, EditorActions } from './shared'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import type { BlockEditorInnerProps } from '@/components/editor/BlockEditorModal'

export function TextBlockEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: BlockEditorInnerProps) {
  const parsed = textBlockSchema.safeParse(initialContent)
  const initial: TextBlockContent = parsed.success ? parsed.data : {}

  const [heading, setHeading] = useState(initial.heading ?? '')
  const [body, setBody] = useState<Record<string, unknown>>(
    (initial.body as Record<string, unknown>) ?? {}
  )
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const result = textBlockSchema.safeParse({ heading: heading || undefined, body })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Validation failed.')
      return
    }

    await onSave(result.data as Record<string, unknown>)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field
        id="text-heading"
        label="Section heading"
        hint="Optional. Appears as an h2 above the text."
      >
        <Input
          id="text-heading"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="About Action Learning"
          maxLength={120}
        />
      </Field>

      <Field id="text-body" label="Body text">
        <RichTextEditor
          value={Object.keys(body).length > 0 ? body : undefined}
          onChange={setBody}
          label="Body text"
          disabled={isSaving}
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <EditorActions onCancel={onCancel} isSaving={isSaving} />
    </form>
  )
}
