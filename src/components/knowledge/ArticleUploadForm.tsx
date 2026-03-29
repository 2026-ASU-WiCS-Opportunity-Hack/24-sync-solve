'use client'

import { useState } from 'react'
import { Input, Button } from '@heroui/react'
import { uploadArticle } from '@/features/knowledge/actions/uploadArticle'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ArticleUploadForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [authors, setAuthors] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a PDF file')

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('authors', authors)
      formData.append('publishedYear', year)
      formData.append('pdf', file)

      const result = await uploadArticle(formData)
      if (result.success) {
        toast.success('Article processed and semantic summary generated!')
        router.refresh()
        // Reset
        setTitle('')
        setAuthors('')
        setYear(new Date().getFullYear().toString())
        setFile(null)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error processing article')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-xl overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-wial-navy text-2xl font-bold">Process Academic PDF</h2>
          <a
            filter-ignore="true"
            href="/resources/research-library"
            target="_blank"
            className="text-wial-red flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            View Live Library &rarr;
          </a>
        </div>
        <p className="mb-6 text-sm text-gray-500">
          Upload a journal article PDF. Our AI engine will read the text, generate a plain-language
          summary in 4 languages, extract key findings, assign relevance tags, and embed it for
          semantic search.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Article Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="focus:border-wial-red focus:ring-wial-red w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm sm:text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Authors (comma separated)</label>
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder="Michael Marquardt, Shannon Banks"
              className="focus:border-wial-red focus:ring-wial-red w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm sm:text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Published Year *</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              className="focus:border-wial-red focus:ring-wial-red w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm sm:text-sm"
            />
          </div>

          <div className="pt-2">
            <label className="mb-2 block pl-1 text-sm font-medium">PDF File</label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="file:bg-wial-red/10 file:text-wial-red hover:file:bg-wial-red/20 w-full text-sm text-slate-500 outline-none file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
            />
          </div>

          <button
            type="submit"
            className="bg-wial-navy hover:bg-opacity-90 mt-8 w-full rounded-lg py-3 font-semibold text-white shadow-sm transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'AI is Processing Document...' : 'Upload & Process with AI'}
          </button>
        </form>
      </div>
    </div>
  )
}
