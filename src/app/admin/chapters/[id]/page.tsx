import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getChapterById } from '@/features/chapters/queries/getChapterAdmin'
import { ChapterForm } from '@/components/admin/ChapterForm'

interface EditChapterPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditChapterPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const chapter = await getChapterById(supabase, id)
  return { title: chapter ? `Edit ${chapter.name}` : 'Edit Chapter' }
}

export default async function EditChapterPage({ params }: EditChapterPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const chapter = await getChapterById(supabase, id)

  if (!chapter) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <Link
          href="/admin/chapters"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          Back to Chapters
        </Link>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit {chapter.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update chapter settings. Slug changes affect all chapter URLs.
          </p>
        </div>
        <Link
          href={`/${chapter.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          aria-label={`View ${chapter.name} site (opens in new tab)`}
        >
          <Globe size={13} aria-hidden="true" />
          View Site
        </Link>
      </div>

      {/* Chapter info */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <span
          className="inline-block size-4 shrink-0 rounded-full"
          style={{ backgroundColor: chapter.accent_color ?? '#CC0000' }}
          aria-hidden="true"
        />
        <div className="text-sm">
          <span className="font-medium text-gray-700">/{chapter.slug}</span>
          <span className="mx-2 text-gray-400">·</span>
          <span className="text-gray-500">{chapter.country_code}</span>
          <span className="mx-2 text-gray-400">·</span>
          <span className={`font-medium ${chapter.is_active ? 'text-green-600' : 'text-gray-500'}`}>
            {chapter.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <ChapterForm chapter={chapter} />
      </div>
    </div>
  )
}
