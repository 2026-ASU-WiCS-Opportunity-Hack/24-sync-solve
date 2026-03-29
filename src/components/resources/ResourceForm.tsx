'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Button,
  Checkbox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  TextArea,
} from '@heroui/react'
import type { ResourceFormData } from '@/features/resources/actions/manageResources'
import type { ActionResult } from '@/types'

interface ResourceFormProps {
  onSubmit: (data: ResourceFormData) => Promise<ActionResult<null>>
  initialData?: Partial<ResourceFormData>
  submitLabel: string
  cancelHref: string
}

const TYPE_OPTIONS = [
  { value: 'video', label: 'Video (YouTube or other video link)' },
  { value: 'article', label: 'Article (journal article or web page)' },
  { value: 'pdf', label: 'PDF (downloadable research/document)' },
  { value: 'webinar', label: 'Webinar (recorded or upcoming)' },
  { value: 'link', label: 'Link (any other URL)' },
] as const

export function ResourceForm({
  onSubmit,
  initialData,
  submitLabel,
  cancelHref,
}: ResourceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<ResourceFormData>({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    type: initialData?.type ?? 'article',
    url: initialData?.url ?? '',
    thumbnail_url: initialData?.thumbnail_url ?? '',
    category: initialData?.category ?? '',
    is_published: initialData?.is_published ?? true,
  })

  function set<K extends keyof ResourceFormData>(key: K, value: ResourceFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await onSubmit(form)
      if (result.success) {
        toast.success(result.message ?? 'Saved.')
        router.push(cancelHref)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Title */}
      <div className="flex flex-col gap-1">
        <Label id="res-title-label" htmlFor="res-title" isRequired>
          Title
        </Label>
        <Input
          id="res-title"
          type="text"
          aria-labelledby="res-title-label"
          required
          maxLength={200}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. Introduction to Action Learning"
        />
      </div>

      {/* Type */}
      <div className="flex flex-col gap-1">
        <Label id="res-type-label" htmlFor="res-type-trigger" isRequired>
          Type
        </Label>
        <Select
          isRequired
          aria-labelledby="res-type-label"
          selectedKey={form.type}
          onSelectionChange={(key) => {
            const val = String(key ?? '') as any
            if (val) set('type', val)
          }}
        >
          <Select.Trigger id="res-type-trigger">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox aria-label="Resource type">
              {TYPE_OPTIONS.map((opt) => (
                <ListBoxItem key={opt.value} id={opt.value} textValue={opt.label}>
                  {opt.label}
                </ListBoxItem>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {/* Meta Fields (Authors / Presenter) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {form.type === 'webinar' && (
          <div className="flex flex-col gap-1">
            <Label id="res-presenter-label" htmlFor="res-presenter">
              Presenter
            </Label>
            <Input
              id="res-presenter"
              value={form.presenter ?? ''}
              onChange={(e) => set('presenter', e.target.value)}
              placeholder="e.g. Dr. Jane Smith"
            />
          </div>
        )}

        {form.type === 'article' && (
          <>
            <div className="flex flex-col gap-1">
              <Label id="res-authors-label" htmlFor="res-authors">
                Authors (comma separated)
              </Label>
              <Input
                id="res-authors"
                value={form.authors?.join(', ') ?? ''}
                onChange={(e) =>
                  set(
                    'authors',
                    e.target.value.split(',').map((s) => s.trim())
                  )
                }
                placeholder="e.g. Jenkins, S., Marquardt, M."
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label id="res-year-label" htmlFor="res-year">
                Published Year
              </Label>
              <Input
                id="res-year"
                type="number"
                value={form.published_year ?? ''}
                onChange={(e) => set('published_year', parseInt(e.target.value) || null)}
                placeholder="2024"
              />
            </div>
          </>
        )}
      </div>

      {/* URL */}
      <div className="flex flex-col gap-1">
        <Label id="res-url-label" htmlFor="res-url" isRequired>
          URL
        </Label>
        {form.type === 'video' && (
          <p className="text-xs text-gray-500">
            Paste a YouTube URL — a thumbnail will be auto-generated.
          </p>
        )}
        {form.type === 'pdf' && (
          <p className="text-xs text-gray-500">
            Upload a PDF via the file upload API and paste the resulting URL.
          </p>
        )}
        <Input
          id="res-url"
          aria-labelledby="res-url-label"
          type="url"
          required
          value={form.url}
          onChange={(e) => set('url', e.target.value)}
          placeholder="https://…"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <Label id="res-description-label" htmlFor="res-description">
          Description
        </Label>
        <TextArea
          id="res-description"
          aria-labelledby="res-description-label"
          rows={3}
          maxLength={500}
          value={form.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Brief description of this resource…"
          className="w-full"
        />
      </div>

      {/* Thumbnail URL */}
      <div className="flex flex-col gap-1">
        <Label id="res-thumbnail-label" htmlFor="res-thumbnail">
          Thumbnail URL <span className="ms-1 text-xs font-normal text-gray-400">(optional)</span>
        </Label>
        <Input
          id="res-thumbnail"
          aria-labelledby="res-thumbnail-label"
          type="url"
          value={form.thumbnail_url ?? ''}
          onChange={(e) => set('thumbnail_url', e.target.value)}
          placeholder="https://… (auto-derived for YouTube links)"
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1">
        <Label id="res-category-label" htmlFor="res-category">
          Category <span className="ms-1 text-xs font-normal text-gray-400">(optional)</span>
        </Label>
        <Input
          id="res-category"
          aria-labelledby="res-category-label"
          type="text"
          maxLength={50}
          value={form.category ?? ''}
          onChange={(e) => set('category', e.target.value)}
          placeholder="e.g. Leadership, Research, Tools"
        />
      </div>

      {/* Published */}
      <Checkbox
        id="res-published"
        isSelected={form.is_published}
        onChange={(checked: boolean) => set('is_published', checked)}
      >
        Published (visible on public site)
      </Checkbox>

      {/* Error */}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          isDisabled={isPending}
          isPending={isPending}
          className="bg-wial-navy hover:bg-wial-navy-dark rounded-lg text-sm font-semibold text-white"
        >
          {isPending ? 'Saving…' : submitLabel}
        </Button>
        <Link href={cancelHref} className="text-sm font-medium text-gray-500 hover:text-gray-700">
          Cancel
        </Link>
      </div>
    </form>
  )
}
