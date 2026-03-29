'use client'

import { useState } from 'react'
import { dividerBlockSchema, type DividerBlockContent } from '@/features/content/blocks/schemas'
import { Field, Select, EditorActions } from './shared'
import type { BlockEditorInnerProps } from '@/components/editor/BlockEditorModal'

export function DividerBlockEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: BlockEditorInnerProps) {
  const parsed = dividerBlockSchema.safeParse(initialContent)
  const initial: DividerBlockContent = parsed.success
    ? parsed.data
    : { style: 'line', spacing: 'md' }

  const [form, setForm] = useState(initial)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = dividerBlockSchema.safeParse(form)
    if (result.success) {
      await onSave(result.data as Record<string, unknown>)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id="divider-style" label="Style">
        <Select
          id="divider-style"
          value={form.style}
          onChange={(e) =>
            setForm((p) => ({ ...p, style: e.target.value as DividerBlockContent['style'] }))
          }
        >
          <option value="line">Line</option>
          <option value="dots">Dots</option>
          <option value="wave">Wave</option>
          <option value="space">Whitespace only</option>
        </Select>
      </Field>

      <Field id="divider-spacing" label="Spacing">
        <Select
          id="divider-spacing"
          value={form.spacing}
          onChange={(e) =>
            setForm((p) => ({ ...p, spacing: e.target.value as DividerBlockContent['spacing'] }))
          }
        >
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </Select>
      </Field>

      <EditorActions onCancel={onCancel} isSaving={isSaving} />
    </form>
  )
}
