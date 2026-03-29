'use client'

import { useState } from 'react'
import { imageBlockSchema, type ImageBlockContent } from '@/features/content/blocks/schemas'
import { Field, Input, EditorActions } from './shared'
import { ImageUpload } from '@/components/editor/ImageUpload'
import type { BlockEditorInnerProps } from '@/components/editor/BlockEditorModal'

export function ImageBlockEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: BlockEditorInnerProps) {
  const parsed = imageBlockSchema.safeParse(initialContent)
  const initial: Partial<ImageBlockContent> = parsed.success ? parsed.data : {}

  const [src, setSrc] = useState(initial.src ?? '')
  const [alt, setAlt] = useState(initial.alt ?? '')
  const [caption, setCaption] = useState(initial.caption ?? '')
  const [errors, setErrors] = useState<Partial<Record<keyof ImageBlockContent, string>>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = imageBlockSchema.safeParse({ src, alt, caption: caption || undefined })
    if (!result.success) {
      const errs: typeof errors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ImageBlockContent
        if (key) errs[key] = issue.message
      }
      setErrors(errs)
      return
    }
    await onSave(result.data as Record<string, unknown>)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id="image-src" label="Image" required error={errors.src}>
        <ImageUpload
          value={src}
          onChange={(url) => {
            setSrc(url)
            setErrors((p) => ({ ...p, src: undefined }))
          }}
          bucket="content-images"
          previewAlt={alt || 'Image'}
        />
      </Field>

      <Field
        id="image-alt"
        label="Alt text"
        required
        error={errors.alt}
        hint="Describe the image for screen readers. Leave empty only for decorative images."
      >
        <Input
          id="image-alt"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="A group of coaches collaborating"
          maxLength={200}
          error={!!errors.alt}
        />
      </Field>

      <Field
        id="image-caption"
        label="Caption"
        error={errors.caption}
        hint="Optional. Shown below the image."
      >
        <Input
          id="image-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Optional caption"
          maxLength={300}
          error={!!errors.caption}
        />
      </Field>

      <EditorActions onCancel={onCancel} isSaving={isSaving} />
    </form>
  )
}
