'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'

type AllowedBucket = 'avatars' | 'coach-photos' | 'chapter-assets' | 'content-images'

interface ImageUploadProps {
  /** Current image URL (shown as preview) */
  value?: string
  /** Called with the new public URL after upload */
  onChange: (url: string) => void
  /** Supabase Storage bucket to upload to */
  bucket?: AllowedBucket
  /** Storage path prefix */
  pathPrefix?: string
  /** Alt text for preview image */
  previewAlt?: string
  /** Human-readable label for the upload area */
  label?: string
  /** Whether the field is disabled */
  disabled?: boolean
}

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/avif,image/gif'
const MAX_SIZE = 2 * 1024 * 1024

/**
 * Drag-and-drop image upload component.
 * Uploads to /api/upload and returns the Supabase Storage public URL.
 */
export function ImageUpload({
  value,
  onChange,
  bucket = 'content-images',
  pathPrefix,
  previewAlt = 'Uploaded image',
  label = 'Upload image',
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Image must be under 2MB.')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)
      if (pathPrefix) formData.append('path', pathPrefix)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const json = (await res.json()) as { url?: string; error?: string }

      if (!res.ok || !json.url) {
        setError(json.error ?? 'Upload failed. Please try again.')
        return
      }

      onChange(json.url)
    } catch {
      setError('Upload failed. Please check your connection.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleClear() {
    onChange('')
  }

  return (
    <div className="space-y-2">
      {/* Preview */}
      {value && (
        <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <div className="relative aspect-video">
            <Image
              src={value}
              alt={previewAlt}
              fill
              className="object-contain p-1"
              sizes="(max-width: 640px) 100vw, 480px"
            />
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Remove image"
              className="absolute end-2 top-2 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Upload area */}
      {!disabled && (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={[
              'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
              isDragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
              isUploading ? 'pointer-events-none opacity-60' : '',
            ].join(' ')}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
            }}
            role="button"
            tabIndex={0}
            aria-label={label}
          >
            {isUploading ? (
              <Loader2 size={20} className="animate-spin text-gray-400" aria-hidden="true" />
            ) : (
              <>
                {value ? (
                  <Upload size={18} className="text-gray-400" aria-hidden="true" />
                ) : (
                  <ImageIcon size={20} className="text-gray-400" aria-hidden="true" />
                )}
              </>
            )}
            <p className="text-sm text-gray-500">
              {isUploading
                ? 'Uploading…'
                : value
                  ? 'Click or drag to replace'
                  : 'Click or drag image here'}
            </p>
            <p className="text-xs text-gray-400">JPEG, PNG, WebP, AVIF — max 2MB</p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            onChange={handleFileSelect}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
          />
        </>
      )}

      {/* Error */}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
