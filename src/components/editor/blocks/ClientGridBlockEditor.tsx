'use client'

import { useState } from 'react'
import { clientGridSchema, type ClientGridBlockContent } from '@/features/content/blocks/schemas'
import { Field, Input, Textarea, ArrayEditor, EditorActions } from './shared'
import { ImageUpload } from '@/components/editor/ImageUpload'
import { X } from 'lucide-react'
import type { BlockEditorInnerProps } from '@/components/editor/BlockEditorModal'

type ClientItem = ClientGridBlockContent['clients'][number]

export function ClientGridBlockEditor({
  initialContent,
  onSave,
  onCancel,
  isSaving,
}: BlockEditorInnerProps) {
  const parsed = clientGridSchema.safeParse(initialContent)
  const initial: ClientGridBlockContent = parsed.success ? parsed.data : { clients: [{ name: '' }] }

  const [heading, setHeading] = useState(initial.heading ?? '')
  const [clients, setClients] = useState<ClientItem[]>(
    initial.clients.map((c) => ({
      name: c.name,
      logo_url: c.logo_url,
      website_url: c.website_url,
      description: c.description,
    }))
  )
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const result = clientGridSchema.safeParse({ heading: heading || undefined, clients })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Validation failed.')
      return
    }
    await onSave(result.data as Record<string, unknown>)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id="cg-heading" label="Section heading" hint="Optional">
        <Input
          id="cg-heading"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="Our Clients"
          maxLength={120}
        />
      </Field>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-gray-700">
          Clients{' '}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        </legend>
        <ArrayEditor
          items={clients}
          onChange={setClients}
          createEmpty={(): ClientItem => ({ name: '' })}
          addLabel="Add client"
          maxItems={24}
          renderItem={(client, idx, onChange, onRemove) => (
            <div key={idx} className="space-y-3 rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  Client {idx + 1}
                </span>
                {clients.length > 1 && (
                  <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove client ${idx + 1}`}
                    className="rounded p-0.5 text-gray-400 hover:text-red-500 focus:ring-2 focus:ring-red-300 focus:outline-none"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`cg-name-${idx}`}
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    Name *
                  </label>
                  <Input
                    id={`cg-name-${idx}`}
                    value={client.name}
                    onChange={(e) => onChange({ ...client, name: e.target.value })}
                    placeholder="Acme Corp"
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor={`cg-website-${idx}`}
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    Website URL
                  </label>
                  <Input
                    id={`cg-website-${idx}`}
                    type="url"
                    value={client.website_url ?? ''}
                    onChange={(e) =>
                      onChange({ ...client, website_url: e.target.value || undefined })
                    }
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor={`cg-desc-${idx}`}
                  className="mb-1 block text-xs font-medium text-gray-600"
                >
                  Short description
                </label>
                <Textarea
                  id={`cg-desc-${idx}`}
                  value={client.description ?? ''}
                  onChange={(e) =>
                    onChange({ ...client, description: e.target.value || undefined })
                  }
                  placeholder="Optional one-line description…"
                  rows={1}
                  maxLength={200}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Logo</label>
                <ImageUpload
                  value={client.logo_url ?? ''}
                  onChange={(url) => onChange({ ...client, logo_url: url || undefined })}
                  bucket="content-images"
                  previewAlt={`${client.name} logo`}
                  label={`Upload logo for ${client.name || `client ${idx + 1}`}`}
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
