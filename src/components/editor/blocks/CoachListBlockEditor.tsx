'use client'

import { useState } from 'react'
import { coachListBlockSchema, type CoachListBlockContent } from '@/features/content/blocks/schemas'
import { Field, Input, Select, EditorActions } from './shared'
import type { BlockEditorInnerProps } from '@/components/editor/BlockEditorModal'

export function CoachListBlockEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: BlockEditorInnerProps) {
  const parsed = coachListBlockSchema.safeParse(initialContent)
  const initial: CoachListBlockContent = parsed.success
    ? parsed.data
    : { max_count: 6, certification_filter: '' }

  const [heading, setHeading] = useState(initial.heading ?? '')
  const [maxCount, setMaxCount] = useState(String(initial.max_count))
  const [certFilter, setCertFilter] = useState<CoachListBlockContent['certification_filter']>(
    initial.certification_filter ?? ''
  )
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const result = coachListBlockSchema.safeParse({
      heading: heading || undefined,
      max_count: parseInt(maxCount, 10),
      certification_filter: certFilter,
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
        Coaches are loaded automatically from the directory. Use these options to filter and
        configure the display.
      </p>

      <Field id="cl-heading" label="Section heading" hint="Optional">
        <Input
          id="cl-heading"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="Featured Coaches"
          maxLength={120}
        />
      </Field>

      <Field id="cl-max" label="Maximum coaches to show">
        <Input
          id="cl-max"
          type="number"
          min={1}
          max={12}
          value={maxCount}
          onChange={(e) => setMaxCount(e.target.value)}
        />
      </Field>

      <Field
        id="cl-cert"
        label="Filter by certification level"
        hint="Leave empty to show all levels"
      >
        <Select
          id="cl-cert"
          value={certFilter}
          onChange={(e) =>
            setCertFilter(e.target.value as CoachListBlockContent['certification_filter'])
          }
        >
          <option value="">All levels</option>
          <option value="CALC">CALC — Certified Action Learning Coach</option>
          <option value="PALC">PALC — Professional Action Learning Coach</option>
          <option value="SALC">SALC — Senior Action Learning Coach</option>
          <option value="MALC">MALC — Master Action Learning Coach</option>
        </Select>
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
