'use client'

import { useState } from 'react'
import {
  testimonialBlockSchema,
  type TestimonialBlockContent,
} from '@/features/content/blocks/schemas'
import { Field, Input, Textarea, ArrayEditor, EditorActions } from './shared'
import { ImageUpload } from '@/components/editor/ImageUpload'
import { X } from 'lucide-react'
import type { BlockEditorInnerProps } from '@/components/editor/BlockEditorModal'

type TestimonialItem = TestimonialBlockContent['items'][number]

export function TestimonialBlockEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: BlockEditorInnerProps) {
  const parsed = testimonialBlockSchema.safeParse(initialContent)
  const initial: TestimonialBlockContent = parsed.success
    ? parsed.data
    : { items: [{ quote: '', name: '' }] }

  const [heading, setHeading] = useState(initial.heading ?? '')
  const [items, setItems] = useState<TestimonialItem[]>(
    initial.items.map((t) => ({
      quote: t.quote,
      name: t.name,
      title: t.title,
      organization: t.organization,
      photo_url: t.photo_url,
    }))
  )
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const result = testimonialBlockSchema.safeParse({ heading: heading || undefined, items })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Validation failed.')
      return
    }
    await onSave(result.data as Record<string, unknown>)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id="testimonial-heading" label="Section heading" hint="Optional">
        <Input
          id="testimonial-heading"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="What our coaches say"
          maxLength={120}
        />
      </Field>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-gray-700">
          Testimonials{' '}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        </legend>
        <ArrayEditor
          items={items}
          onChange={setItems}
          createEmpty={(): TestimonialItem => ({ quote: '', name: '' })}
          addLabel="Add testimonial"
          maxItems={6}
          renderItem={(item, idx, onChange, onRemove) => (
            <div key={idx} className="space-y-3 rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  Testimonial {idx + 1}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove testimonial ${idx + 1}`}
                    className="rounded p-0.5 text-gray-400 hover:text-red-500 focus:ring-2 focus:ring-red-300 focus:outline-none"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
              <div>
                <label
                  htmlFor={`t-quote-${idx}`}
                  className="mb-1 block text-xs font-medium text-gray-600"
                >
                  Quote *
                </label>
                <Textarea
                  id={`t-quote-${idx}`}
                  value={item.quote}
                  onChange={(e) => onChange({ ...item, quote: e.target.value })}
                  placeholder="Action Learning transformed our leadership culture…"
                  rows={3}
                  maxLength={500}
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`t-name-${idx}`}
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    Name *
                  </label>
                  <Input
                    id={`t-name-${idx}`}
                    value={item.name}
                    onChange={(e) => onChange({ ...item, name: e.target.value })}
                    placeholder="Jane Smith"
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor={`t-title-${idx}`}
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    Title
                  </label>
                  <Input
                    id={`t-title-${idx}`}
                    value={item.title ?? ''}
                    onChange={(e) => onChange({ ...item, title: e.target.value })}
                    placeholder="CEO, Acme Corp"
                    maxLength={100}
                  />
                </div>
              </div>
              <div>
                <p className="mb-1 block text-xs font-medium text-gray-600">Photo</p>
                <ImageUpload
                  value={item.photo_url ?? ''}
                  onChange={(url) => onChange({ ...item, photo_url: url || undefined })}
                  bucket="content-images"
                  previewAlt={`${item.name}'s photo`}
                  label={`Upload photo for ${item.name || `testimonial ${idx + 1}`}`}
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
