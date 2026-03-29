'use client'

import { useState } from 'react'
import {
  contactFormBlockSchema,
  type ContactFormBlockContent,
} from '@/features/content/blocks/schemas'
import { Field, Input, Textarea, EditorActions } from './shared'
import type { BlockEditorInnerProps } from '@/components/editor/BlockEditorModal'

export function ContactFormBlockEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: BlockEditorInnerProps) {
  const parsed = contactFormBlockSchema.safeParse(initialContent)
  const initial: ContactFormBlockContent = parsed.success
    ? parsed.data
    : { heading: 'Get in Touch' }

  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormBlockContent, string>>>({})

  function set<K extends keyof ContactFormBlockContent>(key: K, value: ContactFormBlockContent[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = contactFormBlockSchema.safeParse(form)
    if (!result.success) {
      const errs: typeof errors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ContactFormBlockContent
        if (key) errs[key] = issue.message
      }
      setErrors(errs)
      return
    }
    await onSave(result.data as Record<string, unknown>)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id="cf-heading" label="Heading" error={errors.heading}>
        <Input
          id="cf-heading"
          value={form.heading}
          onChange={(e) => set('heading', e.target.value)}
          placeholder="Get in Touch"
          maxLength={120}
          error={!!errors.heading}
        />
      </Field>

      <Field id="cf-subheading" label="Subheading" hint="Optional intro text above the form.">
        <Textarea
          id="cf-subheading"
          value={form.subheading ?? ''}
          onChange={(e) => set('subheading', e.target.value)}
          placeholder="We'd love to hear from you. Send us a message."
          rows={2}
          maxLength={300}
        />
      </Field>

      <Field
        id="cf-email"
        label="Recipient email"
        error={errors.recipient_email}
        hint="Optional. Where form submissions are sent. Falls back to the chapter contact email."
      >
        <Input
          id="cf-email"
          type="email"
          value={form.recipient_email ?? ''}
          onChange={(e) => set('recipient_email', e.target.value)}
          placeholder="contact@chapter.org"
          error={!!errors.recipient_email}
        />
      </Field>

      <EditorActions onCancel={onCancel} isSaving={isSaving} />
    </form>
  )
}
