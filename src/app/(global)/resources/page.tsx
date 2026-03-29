import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getResources } from '@/features/resources/queries/getResources'
import { getUserCompletions } from '@/features/resources/queries/getCompletions'
import { getCoachMapByResourceIds } from '@/features/resources/queries/getCoachCourseMappings'
import { getPermissionContext } from '@/lib/permissions/context'
import { hasPermission } from '@/lib/permissions/permissions'
import { ResourceCard } from '@/components/resources/ResourceCard'
import { ResourceFilters } from '@/components/resources/ResourceFilters'
import { KnowledgeSearchBar } from '@/components/knowledge/KnowledgeSearchBar'
import { ResourceSearchEngine } from '@/components/resources/ResourceSearchEngine'
import { prefillMissingResourceAIAction } from '@/features/resources/actions/generateResourceAI'
import type { ResourceType } from '@/features/resources/types'
import {
  filterResourcesByCollection,
  type ResourceCollection,
} from '@/features/resources/utils/collectionFilter'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'AI Resource Search',
  description: 'Search WIAL resources with an AI-inspired search-first experience.',
}

interface ResourcesPageProps {
  searchParams: Promise<{ q?: string; type?: string; collection?: string }>
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const { q: searchParam, type: typeParam, collection: collectionParam } = await searchParams
  const VALID_TYPES: ResourceType[] = ['video', 'article', 'link']
  const VALID_COLLECTIONS: ResourceCollection[] = ['all', 'journals', 'courses', 'webinars']
  const currentType: ResourceType | null = VALID_TYPES.includes(typeParam as ResourceType)
    ? (typeParam as ResourceType)
    : null
  const currentCollection: ResourceCollection = VALID_COLLECTIONS.includes(
    collectionParam as ResourceCollection
  )
    ? (collectionParam as ResourceCollection)
    : 'all'
  const currentSearch = searchParam ?? null

  const supabase = await createClient()
  const ctx = await getPermissionContext()
  const canManage =
    ctx !== null && !ctx.isSuspended && hasPermission(ctx.globalRole, 'content:create')

  const [resourcesResult, completedIds] = await Promise.all([
    getResources(supabase, {
      // No chapterId, no globalOnly → all resources
      type: currentType,
      search: currentSearch,
      publishedOnly: !canManage,
    }),
    ctx ? getUserCompletions(supabase, ctx.userId) : Promise.resolve(null),
  ])

  let resources = resourcesResult.items

  const resourceCoachMap = await getCoachMapByResourceIds(
    supabase,
    resources.map((resource) => resource.id)
  )

  if (canManage) {
    const missingSummaryIds = resources
      .filter(
        (resource) => !resource.ai_summary && ['video', 'article', 'pdf'].includes(resource.type)
      )
      .map((resource) => resource.id)

    if (missingSummaryIds.length > 0) {
      await prefillMissingResourceAIAction(missingSummaryIds)

      const refreshed = await getResources(supabase, {
        type: currentType,
        search: currentSearch,
        publishedOnly: !canManage,
      })
      resources = refreshed.items
    }
  }

  const filteredResources = filterResourcesByCollection(resources, currentCollection)
  const total = filteredResources.length

  return (
    <main id="main-content" className="bg-white">
      {/* Hero Section */}
      <section className="bg-wial-navy py-20 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between gap-8">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">Resources</h1>
              <p className="mt-6 text-xl leading-8 text-white/80">
                Videos, articles, PDFs, and tools to deepen your Action Learning practice.
              </p>
            </div>
            {canManage && (
              <Link
                href="/resources/manage"
                className="shrink-0 rounded-xl bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Manage Resources
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Primary Discovery Section (AI Search) */}
      <section className="relative z-10 -mt-10 px-6 pb-16 lg:px-8">
        <div className="shadow-navy/10 mx-auto max-w-5xl rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl">
          <div className="mb-10 text-center">
            <h2 className="text-wial-navy text-3xl font-bold">Search the Knowledge Base</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-500">
              Ask questions or find specific topics across our entire library of research articles,
              videos, and webinars.
            </p>
          </div>
          <KnowledgeSearchBar userRole={ctx?.globalRole ?? null} />
        </div>
      </section>

      {/* Filters + grid */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Search engine */}
          <div className="mb-8">
            <Suspense>
              <ResourceSearchEngine
                currentSearch={currentSearch}
                currentType={currentType}
                currentCollection={currentCollection}
              />
            </Suspense>
          </div>

          {/* Resource count */}
          <p className="mb-6 text-sm text-gray-500" aria-live="polite">
            {total === 0
              ? 'No results found. Try a different keyword.'
              : `${total} result${total !== 1 ? 's' : ''}`}
          </p>

          {/* Grid */}
          {filteredResources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
              <p className="font-medium text-gray-500">No resources yet.</p>
              {canManage ? (
                <Link
                  href="/resources/manage/create"
                  className="text-wial-red mt-3 inline-block text-sm font-medium hover:underline"
                >
                  Add your first resource →
                </Link>
              ) : (
                <p className="mt-2 text-sm text-gray-400">Check back soon.</p>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  teachingCoaches={resourceCoachMap[resource.id] ?? []}
                  canGenerateAI={canManage}
                  isCompleted={completedIds ? completedIds.has(resource.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
