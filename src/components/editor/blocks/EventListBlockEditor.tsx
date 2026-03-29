'use client'

import { useState } from 'react'
import { eventListBlockSchema, type EventListBlockContent } from '@/features/content/blocks/schemas'
import { Field, Input, EditorActions } from './shared'
import type { BlockEditorInnerProps } from '@/components/editor/BlockEditorModal'

export function EventListBlockEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: BlockEditorInnerProps) {
  const parsed = eventListBlockSchema.safeParse(initialContent)
  const initial: EventListBlockContent = parsed.success
    ? parsed.data
    : { max_count: 3, show_past: false }

  const [heading, setHeading] = useState(initial.heading ?? '')
  const [maxCount, setMaxCount] = useState(String(initial.max_count))
  const [showPast, setShowPast] = useState(initial.show_past)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const result = eventListBlockSchema.safeParse({
      heading: heading || undefined,
      max_count: parseInt(maxCount, 10),
      show_past: showPast,
    })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Validation failed.')
      return
    }
    await onSave(result.data as Record<string, unknown>)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
        Events are loaded automatically from the database. Use these options to configure the
        display.
      </p>

      <Field id="el-heading" label="Section heading" hint="Optional">
        <Input
          id="el-heading"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="Upcoming Events"
          maxLength={120}
        />
      </Field>

      <Field id="el-max" label="Maximum events to show">
        <Input
          id="el-max"
          type="number"
          min={1}
          max={20}
          value={maxCount}
          onChange={(e) => setMaxCount(e.target.value)}
        />
      </Field>

      <div className="flex items-center gap-2">
        <input
          id="el-show-past"
          type="checkbox"
          checked={showPast}
          onChange={(e) => setShowPast(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400"
        />
        <label htmlFor="el-show-past" className="text-sm text-gray-700">
          Show past events
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <EditorActions onCancel={onCancel} isSaving={isSaving} />
    </form>
  )
}
