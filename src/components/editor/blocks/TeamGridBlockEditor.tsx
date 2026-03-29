'use client'

import { useState } from 'react'
import { teamGridBlockSchema, type TeamGridBlockContent } from '@/features/content/blocks/schemas'
import { Field, Input, Textarea, ArrayEditor, EditorActions } from './shared'
import { ImageUpload } from '@/components/editor/ImageUpload'
import { X } from 'lucide-react'
import type { BlockEditorInnerProps } from '@/components/editor/BlockEditorModal'

type TeamMember = TeamGridBlockContent['members'][number]

export function TeamGridBlockEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: BlockEditorInnerProps) {
  const parsed = teamGridBlockSchema.safeParse(initialContent)
  const initial: TeamGridBlockContent = parsed.success ? parsed.data : { members: [{ name: '' }] }

  const [heading, setHeading] = useState(initial.heading ?? '')
  const [members, setMembers] = useState<TeamMember[]>(
    initial.members.map((m) => ({
      name: m.name,
      title: m.title,
      bio: m.bio,
      photo_url: m.photo_url,
    }))
  )
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const result = teamGridBlockSchema.safeParse({ heading: heading || undefined, members })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Validation failed.')
      return
    }
    await onSave(result.data as Record<string, unknown>)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id="team-heading" label="Section heading" hint="Optional">
        <Input
          id="team-heading"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="Our Team"
          maxLength={120}
        />
      </Field>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-gray-700">
          Team members{' '}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        </legend>
        <ArrayEditor
          items={members}
          onChange={setMembers}
          createEmpty={(): TeamMember => ({ name: '' })}
          addLabel="Add team member"
          maxItems={16}
          renderItem={(member, idx, onChange, onRemove) => (
            <div key={idx} className="space-y-3 rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  Member {idx + 1}
                </span>
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove member ${idx + 1}`}
                    className="rounded p-0.5 text-gray-400 hover:text-red-500 focus:ring-2 focus:ring-red-300 focus:outline-none"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`tm-name-${idx}`}
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    Name *
                  </label>
                  <Input
                    id={`tm-name-${idx}`}
                    value={member.name}
                    onChange={(e) => onChange({ ...member, name: e.target.value })}
                    placeholder="Jane Smith"
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor={`tm-title-${idx}`}
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    Title
                  </label>
                  <Input
                    id={`tm-title-${idx}`}
                    value={member.title ?? ''}
                    onChange={(e) => onChange({ ...member, title: e.target.value })}
                    placeholder="Chapter Director"
                    maxLength={100}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor={`tm-bio-${idx}`}
                  className="mb-1 block text-xs font-medium text-gray-600"
                >
                  Bio
                </label>
                <Textarea
                  id={`tm-bio-${idx}`}
                  value={member.bio ?? ''}
                  onChange={(e) => onChange({ ...member, bio: e.target.value })}
                  placeholder="Brief bio…"
                  rows={2}
                  maxLength={400}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Photo</label>
                <ImageUpload
                  value={member.photo_url ?? ''}
                  onChange={(url) => onChange({ ...member, photo_url: url || undefined })}
                  bucket="content-images"
                  previewAlt={`${member.name}'s photo`}
                  label={`Upload photo for ${member.name || `member ${idx + 1}`}`}
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
