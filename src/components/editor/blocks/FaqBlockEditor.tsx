'use client'

import { useState } from 'react'
import { faqBlockSchema, type FaqBlockContent } from '@/features/content/blocks/schemas'
import { Field, Input, Textarea, ArrayEditor, EditorActions } from './shared'
import { X } from 'lucide-react'
import type { BlockEditorInnerProps } from '@/components/editor/BlockEditorModal'

type FaqItem = FaqBlockContent['items'][number]

export function FaqBlockEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: BlockEditorInnerProps) {
  const parsed = faqBlockSchema.safeParse(initialContent)
  const initial: FaqBlockContent = parsed.success
    ? parsed.data
    : { items: [{ question: '', answer: '' }] }

  const [heading, setHeading] = useState(initial.heading ?? '')
  const [items, setItems] = useState<FaqItem[]>(initial.items)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const result = faqBlockSchema.safeParse({ heading: heading || undefined, items })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Validation failed.')
      return
    }
    await onSave(result.data as Record<string, unknown>)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id="faq-heading" label="Section heading" hint="Optional">
        <Input
          id="faq-heading"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="Frequently Asked Questions"
          maxLength={120}
        />
      </Field>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-gray-700">
          Questions &amp; Answers{' '}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        </legend>
        <ArrayEditor
          items={items}
          onChange={setItems}
          createEmpty={() => ({ question: '', answer: '' })}
          addLabel="Add FAQ item"
          maxItems={20}
          renderItem={(item, idx, onChange, onRemove) => (
            <div key={idx} className="space-y-2 rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  Item {idx + 1}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove FAQ item ${idx + 1}`}
                    className="rounded p-0.5 text-gray-400 hover:text-red-500 focus:ring-2 focus:ring-red-300 focus:outline-none"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
              <div>
                <label
                  htmlFor={`faq-q-${idx}`}
                  className="mb-1 block text-xs font-medium text-gray-600"
                >
                  Question *
                </label>
                <Input
                  id={`faq-q-${idx}`}
                  value={item.question}
                  onChange={(e) => onChange({ ...item, question: e.target.value })}
                  placeholder="What is Action Learning?"
                  maxLength={200}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor={`faq-a-${idx}`}
                  className="mb-1 block text-xs font-medium text-gray-600"
                >
                  Answer *
                </label>
                <Textarea
                  id={`faq-a-${idx}`}
                  value={item.answer}
                  onChange={(e) => onChange({ ...item, answer: e.target.value })}
                  placeholder="Action Learning is a process…"
                  rows={3}
                  maxLength={1000}
                  required
                />
              </div>
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
