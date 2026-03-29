import { KnowledgeSearchBar } from '@/components/knowledge/KnowledgeSearchBar'
import { getCurrentUserRole } from '@/lib/utils/serverAuth'

export const metadata = {
  title: 'Research Library | WIAL',
  description: 'Search Action Learning research articles and find matching coaches globally.',
}

export default async function ResearchLibraryPage() {
  const role = await getCurrentUserRole()

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-24">
      <div className="mx-auto mb-12 max-w-5xl px-6 text-center">
        <h1 className="text-wial-navy mb-6 text-4xl font-extrabold md:text-5xl">
          AI Knowledge <span className="text-wial-red">Engine</span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-600">
          Search our global database of Action Learning research, journals, and publications.
          Discover insights and instantly find certified coaches who specialize in those areas.
        </p>
      </div>

      <KnowledgeSearchBar userRole={role} />
    </div>
  )
}
