'use client'

import { useState } from 'react'
import { videoBlockSchema, type VideoBlockContent } from '@/features/content/blocks/schemas'
import { Field, Input, Select, EditorActions } from './shared'
import type { BlockEditorInnerProps } from '@/components/editor/BlockEditorModal'

export function VideoBlockEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: BlockEditorInnerProps) {
  const parsed = videoBlockSchema.safeParse(initialContent)
  const initial: VideoBlockContent = parsed.success ? parsed.data : { url: '', aspect: '16:9' }

  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof VideoBlockContent, string>>>({})

  function set<K extends keyof VideoBlockContent>(key: K, value: VideoBlockContent[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = videoBlockSchema.safeParse(form)
    if (!result.success) {
      const errs: typeof errors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof VideoBlockContent
        if (key) errs[key] = issue.message
      }
      setErrors(errs)
      return
    }
    await onSave(result.data as Record<string, unknown>)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field
        id="video-url"
        label="YouTube or Vimeo URL"
        required
        error={errors.url}
        hint="e.g. https://www.youtube.com/watch?v=… or https://vimeo.com/…"
      >
        <Input
          id="video-url"
          type="url"
          value={form.url}
          onChange={(e) => set('url', e.target.value)}
          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          required
          error={!!errors.url}
        />
      </Field>

      <Field id="video-caption" label="Caption" hint="Optional. Shown below the video.">
        <Input
          id="video-caption"
          value={form.caption ?? ''}
          onChange={(e) => set('caption', e.target.value)}
          placeholder="Introduction to Action Learning"
          maxLength={300}
        />
      </Field>

      <Field id="video-aspect" label="Aspect ratio">
        <Select
          id="video-aspect"
          value={form.aspect}
          onChange={(e) => set('aspect', e.target.value as VideoBlockContent['aspect'])}
        >
          <option value="16:9">16:9 (Widescreen)</option>
          <option value="4:3">4:3 (Standard)</option>
          <option value="1:1">1:1 (Square)</option>
        </Select>
      </Field>

      <EditorActions onCancel={onCancel} isSaving={isSaving} />
    </form>
  )
}
