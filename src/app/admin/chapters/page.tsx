import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAllChaptersAdmin } from '@/features/chapters/queries/getChapterAdmin'
import { formatDate } from '@/lib/utils/format'
import { Plus, Pencil, Globe, Sparkles } from 'lucide-react'

export const metadata: Metadata = { title: 'Chapters' }

export const revalidate = 60

export default async function AdminChaptersPage() {
  const supabase = await createClient()
  const chapters = await getAllChaptersAdmin(supabase)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chapters</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage regional WIAL chapters and their provisioned pages.
          </p>
        </div>
        <Link
          href="/admin/chapters/new"
          className="bg-wial-navy hover:bg-wial-navy-dark flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          <Plus size={16} aria-hidden="true" />
          New Chapter
        </Link>
      </div>

      {/* Chapters table */}
      {chapters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <Globe size={36} className="mx-auto mb-3 text-gray-300" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-500">No chapters yet.</p>
          <Link
            href="/admin/chapters/new"
            className="bg-wial-navy mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            Create the first chapter
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm" aria-label="Chapters list">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Chapter
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Country
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-gray-700">
                  Coaches
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-gray-700">
                  Events
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  Created
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chapters.map((chapter) => (
                <tr key={chapter.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* Accent color swatch */}
                      <span
                        className="inline-block size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: chapter.accent_color ?? '#CC0000' }}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{chapter.name}</p>
                        <p className="text-xs text-gray-600">/{chapter.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{chapter.country_code}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{chapter.coach_count}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{chapter.event_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        chapter.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {chapter.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(chapter.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/chapters/${chapter.id}`}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                        aria-label={`Edit ${chapter.name}`}
                      >
                        <Pencil size={12} aria-hidden="true" />
                        Edit
                      </Link>
                      <Link
                        href={`/admin/chapters/${chapter.id}/generate`}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                        aria-label={`Generate content for ${chapter.name}`}
                      >
                        <Sparkles size={12} aria-hidden="true" />
                        Generate
                      </Link>
                      <Link
                        href={`/${chapter.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                        aria-label={`View ${chapter.name} site (opens in new tab)`}
                      >
                        <Globe size={12} aria-hidden="true" />
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
