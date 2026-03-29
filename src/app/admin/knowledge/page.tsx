import Link from 'next/link'

export default function KnowledgeAdminPage() {
  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-wial-navy mb-8 text-3xl font-bold">Knowledge Engine Admin</h1>
        <p className="mb-6 text-gray-600">
          Upload WIAL journal articles and research papers here. The AI engine (Claude or GPT-4o)
          will automatically process them, generate summaries in multiple languages, and make them
          semantically searchable.
        </p>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-wial-red mb-4 text-sm font-semibold">
            Supported models: Claude (claude-3-5-sonnet) and GPT-4o
          </p>
          <Link
            href="/admin/knowledge/upload"
            className="bg-wial-navy inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90"
          >
            Upload &amp; Process an Article
          </Link>
        </div>
      </div>
    </div>
  )
}
