'use client'

import { useState } from 'react'
import { statsBlockSchema, type StatsBlockContent } from '@/features/content/blocks/schemas'
import { Field, Input, ArrayEditor, EditorActions } from './shared'
import { X } from 'lucide-react'
import type { BlockEditorInnerProps } from '@/components/editor/BlockEditorModal'

type StatItem = StatsBlockContent['items'][number]

export function StatsBlockEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: BlockEditorInnerProps) {
  const parsed = statsBlockSchema.safeParse(initialContent)
  const initial: StatsBlockContent = parsed.success
    ? parsed.data
    : { items: [{ label: '', value: '' }] }

  const [heading, setHeading] = useState(initial.heading ?? '')
  const [items, setItems] = useState<StatItem[]>(initial.items)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const result = statsBlockSchema.safeParse({ heading: heading || undefined, items })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Validation failed.')
      return
    }
    await onSave(result.data as Record<string, unknown>)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id="stats-heading" label="Section heading" hint="Optional">
        <Input
          id="stats-heading"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="Our Impact"
          maxLength={120}
        />
      </Field>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-gray-700">
          Statistics{' '}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        </legend>
        <ArrayEditor
          items={items}
          onChange={setItems}
          createEmpty={() => ({ label: '', value: '' })}
          addLabel="Add statistic"
          maxItems={8}
          renderItem={(item, idx, onChange, onRemove) => (
            <div key={idx} className="flex items-start gap-2 rounded-lg border border-gray-200 p-3">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`stat-value-${idx}`}
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    Value
                  </label>
                  <Input
                    id={`stat-value-${idx}`}
                    value={item.value}
                    onChange={(e) => onChange({ ...item, value: e.target.value })}
                    placeholder="500+"
                    maxLength={30}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor={`stat-label-${idx}`}
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    Label
                  </label>
                  <Input
                    id={`stat-label-${idx}`}
                    value={item.label}
                    onChange={(e) => onChange({ ...item, label: e.target.value })}
                    placeholder="Certified Coaches"
                    maxLength={80}
                    required
                  />
                </div>
              </div>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={onRemove}
                  aria-label={`Remove statistic ${idx + 1}`}
                  className="mt-5 rounded p-1 text-gray-400 hover:text-red-500 focus:ring-2 focus:ring-red-300 focus:outline-none"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        />
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <EditorActions onCancel={onCancel} isSaving={isSaving} />
    </form>
  )
}
