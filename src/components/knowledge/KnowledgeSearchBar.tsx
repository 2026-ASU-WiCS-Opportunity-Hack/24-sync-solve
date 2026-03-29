'use client'

import { useState } from 'react'
import { searchKnowledge } from '@/features/knowledge/actions/searchKnowledge'
import { Search } from 'lucide-react'
import type { JournalArticle } from '@/features/knowledge/types'
import { ArticleCard } from '@/components/knowledge/ArticleCard'
import type { UserRole } from '@/types'

interface CoachResult {
  user_id: string
  bio?: string
  specializations?: string[]
  location_city?: string
  location_country?: string
  certification_level?: string
  profiles?: { full_name?: string; avatar_url?: string }
}

interface KnowledgeSearchBarProps {
  userRole: UserRole | null
}

export function KnowledgeSearchBar({ userRole }: KnowledgeSearchBarProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    articles: JournalArticle[]
    coaches: CoachResult[]
  } | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const res = await searchKnowledge(query)
      setResults(res as { articles: JournalArticle[]; coaches: CoachResult[] })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4">
      <form onSubmit={handleSearch} className="mb-8 flex w-full max-w-2xl gap-2">
        <div className="relative flex-grow">
          <Search
            className="pointer-events-none absolute top-1/2 start-3 h-5 w-5 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Action Learning for healthcare teams"
            aria-label="Knowledge search query"
            className="focus:border-wial-red focus:ring-wial-red w-full rounded-lg border border-gray-300 py-3 ps-10 pe-4 text-base shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-wial-red hover:bg-wial-red/90 flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white shadow-sm transition disabled:opacity-50"
        >
          {loading ? 'Searching\u2026' : 'Search'}
        </button>
      </form>

      {results && (
        <div className="w-full space-y-12">
          {results.articles.length > 0 ? (
            <section aria-label="Relevant research articles">
              <div className="mb-6 flex items-baseline justify-between border-b pb-2">
                <h2 className="text-wial-navy text-2xl font-bold">
                  Relevant Research ({results.articles.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {results.articles.map((article) => (
                  <ArticleCard key={article.id} article={article} userRole={userRole} />
                ))}
              </div>
            </section>
          ) : (
            <p className="py-4 text-center text-gray-500">No matching articles found.</p>
          )}

          {results.coaches.length > 0 && (
            <section aria-label="Matching coaches">
              <div className="mb-6 flex items-baseline justify-between border-b pb-2">
                <h2 className="text-wial-navy text-2xl font-bold">Coaches (Semantic Match)</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {results.coaches.map((coach) => {
                  const initials = coach.profiles?.full_name
                    ? coach.profiles.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : '?'
                  return (
                    <div
                      key={coach.user_id}
                      className="flex gap-4 rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      {/* Avatar */}
                      <div className="bg-wial-navy flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-xl font-bold text-white">
                        {coach.profiles?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={coach.profiles.avatar_url}
                            alt={coach.profiles.full_name ?? 'Coach avatar'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="flex grow flex-col truncate">
                        <div className="me-1 truncate text-lg font-semibold">
                          {coach.profiles?.full_name}
                        </div>
                        <div className="text-wial-red mb-1.5 text-sm font-medium">
                          {coach.certification_level} Coach
                        </div>
                        <div className="truncate text-sm text-gray-500">{coach.location_city}</div>
                        {coach.specializations && coach.specializations.length > 0 && (
                          <div className="mt-1 truncate text-xs font-medium tracking-wide text-gray-400 uppercase">
                            {coach.specializations.join(' \u2022 ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
