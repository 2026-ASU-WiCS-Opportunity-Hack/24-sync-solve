'use client'

import { useState } from 'react'
import { ctaBlockSchema, type CtaBlockContent } from '@/features/content/blocks/schemas'
import { Field, Input, Textarea, Select, EditorActions } from './shared'
import type { BlockEditorInnerProps } from '@/components/editor/BlockEditorModal'

export function CtaBlockEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: BlockEditorInnerProps) {
  const parsed = ctaBlockSchema.safeParse(initialContent)
  const initial: CtaBlockContent = parsed.success
    ? parsed.data
    : { heading: '', button_text: '', button_href: '', variant: 'dark' }

  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof CtaBlockContent, string>>>({})

  function set<K extends keyof CtaBlockContent>(key: K, value: CtaBlockContent[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = ctaBlockSchema.safeParse(form)
    if (!result.success) {
      const errs: typeof errors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CtaBlockContent
        if (key) errs[key] = issue.message
      }
      setErrors(errs)
      return
    }
    await onSave(result.data as Record<string, unknown>)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id="cta-heading" label="Heading" required error={errors.heading}>
        <Input
          id="cta-heading"
          value={form.heading}
          onChange={(e) => set('heading', e.target.value)}
          placeholder="Ready to get started?"
          required
          maxLength={120}
          error={!!errors.heading}
        />
      </Field>

      <Field id="cta-subheading" label="Subheading" error={errors.subheading}>
        <Textarea
          id="cta-subheading"
          value={form.subheading ?? ''}
          onChange={(e) => set('subheading', e.target.value)}
          placeholder="Join hundreds of coaches worldwide"
          rows={2}
          maxLength={300}
          error={!!errors.subheading}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="cta-btn-text" label="Button text" required error={errors.button_text}>
          <Input
            id="cta-btn-text"
            value={form.button_text}
            onChange={(e) => set('button_text', e.target.value)}
            placeholder="Learn More"
            required
            maxLength={60}
            error={!!errors.button_text}
          />
        </Field>
        <Field id="cta-btn-href" label="Button URL" required error={errors.button_href}>
          <Input
            id="cta-btn-href"
            type="url"
            value={form.button_href}
            onChange={(e) => set('button_href', e.target.value)}
            placeholder="https://example.com"
            required
            error={!!errors.button_href}
          />
        </Field>
      </div>

      <Field id="cta-variant" label="Background style">
        <Select
          id="cta-variant"
          value={form.variant}
          onChange={(e) => set('variant', e.target.value as CtaBlockContent['variant'])}
        >
          <option value="dark">Dark (navy)</option>
          <option value="light">Light (gray)</option>
          <option value="accent">Accent color</option>
        </Select>
      </Field>

      <EditorActions onCancel={onCancel} isSaving={isSaving} />
    </form>
  )
}
