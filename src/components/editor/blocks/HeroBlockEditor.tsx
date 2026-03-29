'use client'

import { useState } from 'react'
import { heroBlockSchema, type HeroBlockContent } from '@/features/content/blocks/schemas'
import { Field, Input, Textarea, EditorActions } from './shared'
import { ImageUpload } from '@/components/editor/ImageUpload'
import type { BlockEditorInnerProps } from '@/components/editor/BlockEditorModal'

export function HeroBlockEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: BlockEditorInnerProps) {
  const parsed = heroBlockSchema.safeParse(initialContent)
  const initial: HeroBlockContent = parsed.success
    ? parsed.data
    : {
        headline: '',
        subheadline: '',
        cta_primary_text: '',
        cta_primary_href: '',
        cta_secondary_text: '',
        cta_secondary_href: '',
        background_image_url: '',
      }

  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof HeroBlockContent, string>>>({})

  function set<K extends keyof HeroBlockContent>(key: K, value: HeroBlockContent[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = heroBlockSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: typeof errors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof HeroBlockContent
        if (key) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    await onSave(result.data as Record<string, unknown>)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id="hero-headline" label="Headline" required error={errors.headline}>
        <Input
          id="hero-headline"
          value={form.headline}
          onChange={(e) => set('headline', e.target.value)}
          placeholder="Welcome to our chapter"
          required
          error={!!errors.headline}
          maxLength={120}
        />
      </Field>

      <Field id="hero-subheadline" label="Subheadline" error={errors.subheadline}>
        <Textarea
          id="hero-subheadline"
          value={form.subheadline ?? ''}
          onChange={(e) => set('subheadline', e.target.value)}
          placeholder="A short description of your chapter…"
          rows={3}
          maxLength={300}
          error={!!errors.subheadline}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="hero-cta-primary-text"
          label="Primary button text"
          error={errors.cta_primary_text}
        >
          <Input
            id="hero-cta-primary-text"
            value={form.cta_primary_text ?? ''}
            onChange={(e) => set('cta_primary_text', e.target.value)}
            placeholder="Find a Coach"
            maxLength={60}
            error={!!errors.cta_primary_text}
          />
        </Field>
        <Field
          id="hero-cta-primary-href"
          label="Primary button URL"
          error={errors.cta_primary_href}
        >
          <Input
            id="hero-cta-primary-href"
            type="url"
            value={form.cta_primary_href ?? ''}
            onChange={(e) => set('cta_primary_href', e.target.value)}
            placeholder="https://example.com"
            error={!!errors.cta_primary_href}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="hero-cta-secondary-text"
          label="Secondary button text"
          error={errors.cta_secondary_text}
        >
          <Input
            id="hero-cta-secondary-text"
            value={form.cta_secondary_text ?? ''}
            onChange={(e) => set('cta_secondary_text', e.target.value)}
            placeholder="Get Certified"
            maxLength={60}
            error={!!errors.cta_secondary_text}
          />
        </Field>
        <Field
          id="hero-cta-secondary-href"
          label="Secondary button URL"
          error={errors.cta_secondary_href}
        >
          <Input
            id="hero-cta-secondary-href"
            type="url"
            value={form.cta_secondary_href ?? ''}
            onChange={(e) => set('cta_secondary_href', e.target.value)}
            placeholder="https://example.com"
            error={!!errors.cta_secondary_href}
          />
        </Field>
      </div>

      <Field
        id="hero-bg-image"
        label="Background image"
        hint="Optional. Appears with 20% opacity behind the hero."
      >
        <ImageUpload
          value={form.background_image_url ?? ''}
          onChange={(url) => set('background_image_url', url)}
          bucket="content-images"
          previewAlt="Hero background image"
        />
      </Field>

      <EditorActions onCancel={onCancel} isSaving={isSaving} />
    </form>
  )
}
