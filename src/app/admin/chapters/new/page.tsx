import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ChapterForm } from '@/components/admin/ChapterForm'

export const metadata: Metadata = { title: 'New Chapter' }

export default function NewChapterPage() {
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Chapter</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new regional WIAL chapter. Default pages will be provisioned automatically.
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <ChapterForm />
      </div>
    </div>
  )
}
