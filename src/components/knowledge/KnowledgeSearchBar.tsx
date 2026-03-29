'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input, Button, Tabs, Tab, Avatar } from '@heroui/react'
import { searchKnowledge } from '@/features/knowledge/actions/searchKnowledge'
import { ResourceCard } from '@/components/resources/ResourceCard'
import type { Resource } from '@/features/resources/types'
import type {
  CoursePreview,
  TeachingCoachPreview,
} from '@/features/resources/queries/getCoachCourseMappings'
import type { UserRole } from '@/types'

interface SearchResourceResult extends Resource {
  teachingCoaches?: TeachingCoachPreview[]
}

interface SearchCoachResult {
  id: string
  user_id: string
  bio: string | null
  specializations: string[]
  location_city: string | null
  location_country: string | null
  certification_level: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
  courses: CoursePreview[]
}

interface KnowledgeSearchResult {
  resources: SearchResourceResult[]
  coaches: SearchCoachResult[]
}

export function KnowledgeSearchBar({ userRole }: { userRole: UserRole | null }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<KnowledgeSearchResult | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const res = await searchKnowledge(query)
      setResults(res as KnowledgeSearchResult)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
      <form onSubmit={handleSearch} className="mb-8 flex w-full max-w-2xl gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Action Learning for healthcare teams"
          className="flex-grow"
        />
        <Button
          type="submit"
          size="lg"
          variant="primary"
          className="bg-wial-red text-white"
          isPending={loading}
        >
          Search
        </Button>
      </form>

      {results && (
        <div className="w-full space-y-12">
          {results.resources.length > 0 ? (
            <section>
              <div className="mb-6 flex items-baseline justify-between border-b pb-2">
                <h2 className="text-wial-navy text-2xl font-bold">
                  Matched Resources ({results.resources.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {results.resources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    teachingCoaches={resource.teachingCoaches ?? []}
                  />
                ))}
              </div>
            </section>
          ) : (
            <p className="py-4 text-center text-gray-500">No matching resources found.</p>
          )}

          {results.coaches.length > 0 && (
            <section>
              <div className="mb-6 flex items-baseline justify-between border-b pb-2">
                <h2 className="text-wial-navy text-2xl font-bold">Coaches (Semantic Match)</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {results.coaches.map((coach) => (
                  <div
                    key={coach.id}
                    className="flex gap-4 rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <Avatar className="text-large h-16 w-16 flex-shrink-0">
                      <Avatar.Image
                        src={coach.profiles?.avatar_url ?? undefined}
                        alt={coach.profiles?.full_name ?? 'Coach'}
                      />
                    </Avatar>
                    <div className="flex flex-grow flex-col truncate">
                      <div className="mr-1 truncate text-lg font-semibold">
                        <Link href={`/coaches/${coach.id}`} className="hover:underline">
                          {coach.profiles?.full_name}
                        </Link>
                      </div>
                      <div className="text-wial-red mb-1.5 text-sm font-medium">
                        {coach.certification_level} Coach
                      </div>
                      <div className="truncate text-sm text-gray-500">
                        {coach.location_city}, {coach.location_country}
                      </div>
                      {coach.specializations && coach.specializations.length > 0 && (
                        <div className="mt-1 truncate text-xs font-medium tracking-wide text-gray-400 uppercase">
                          {coach.specializations.join(' • ')}
                        </div>
                      )}
                      {coach.courses.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase">
                            Courses Taught
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {coach.courses.slice(0, 3).map((course) => (
                              <a
                                key={course.id}
                                href={course.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-brand-shell)] hover:bg-red-100"
                              >
                                {course.title}
                              </a>
                            ))}
                            {coach.courses.length > 3 && (
                              <span className="text-[10px] text-gray-400">
                                +{coach.courses.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
