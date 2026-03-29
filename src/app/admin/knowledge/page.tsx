export default function KnowledgeUploadPage() {
  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-wial-navy mb-8 text-3xl font-bold">Knowledge Engine Admin</h1>
        <p className="mb-6 text-gray-600">
          Upload WIAL journal articles and research papers here. The AI will automatically process
          them, generate summaries in multiple languages, and make them semantically searchable.
        </p>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-wial-red mb-4 text-sm font-semibold">
            Note: This is a demo for the AI-4 feature.
          </p>
          <p className="text-gray-700">
            Please navigate directly to{' '}
            <a href="/admin/knowledge/upload" className="text-blue-600 underline">
              /admin/knowledge/upload
            </a>{' '}
            to use the tool.
          </p>
        </div>
      </div>
    </div>
  )
}
