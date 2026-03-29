import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getResources } from '@/features/resources/queries/getResources'
import { getUserCompletions } from '@/features/resources/queries/getCompletions'
import { getPermissionContext } from '@/lib/permissions/context'
import { hasPermission } from '@/lib/permissions/permissions'
import { ResourceCard } from '@/components/resources/ResourceCard'
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
    <main id="main-content">
      {/* Hero */}
      <section className="bg-wial-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">AI Search Engine</h1>
              <p className="mt-4 max-w-2xl text-lg text-white/80">
                Search across all WIAL resources from one intelligent search interface.
              </p>
            </div>
            {canManage && (
              <Link
                href="/resources/manage"
                className="shrink-0 rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Manage Resources
              </Link>
            )}
          </div>
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
