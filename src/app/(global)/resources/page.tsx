import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getResources, getResourceCategories } from '@/features/resources/queries/getResources'
import { getUserCompletions } from '@/features/resources/queries/getCompletions'
import { getPermissionContext } from '@/lib/permissions/context'
import { hasPermission } from '@/lib/permissions/permissions'
import { ResourceCard } from '@/components/resources/ResourceCard'
import { ResourceFilters } from '@/components/resources/ResourceFilters'
import type { ResourceType } from '@/features/resources/types'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Videos, articles, PDFs, and tools to deepen your Action Learning practice — curated by WIAL.',
}

interface ResourcesPageProps {
  searchParams: Promise<{ type?: string; category?: string; q?: string }>
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const { type: typeParam, category: categoryParam, q: searchParam } = await searchParams

  const VALID_TYPES: ResourceType[] = ['video', 'article', 'pdf', 'link']
  const currentType: ResourceType | null = VALID_TYPES.includes(typeParam as ResourceType)
    ? (typeParam as ResourceType)
    : null
  const currentCategory = categoryParam ?? null
  const currentSearch = searchParam ?? null

  const supabase = await createClient()
  const ctx = await getPermissionContext()
  const canManage =
    ctx !== null && !ctx.isSuspended && hasPermission(ctx.globalRole, 'content:create')

  const [{ items: resources, total }, categories, completedIds] = await Promise.all([
    getResources(supabase, {
      // No chapterId, no globalOnly → all resources
      type: currentType,
      category: currentCategory,
      search: currentSearch,
      publishedOnly: !canManage,
    }),
    getResourceCategories(supabase),
    ctx ? getUserCompletions(supabase, ctx.userId) : Promise.resolve(null),
  ])

  return (
    <main id="main-content">
      {/* Hero */}
      <section className="bg-wial-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Resources</h1>
              <p className="mt-4 max-w-2xl text-lg text-white/80">
                Videos, articles, PDFs, and tools to deepen your Action Learning practice.
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
          {/* Filter tabs */}
          <div className="mb-8">
            <Suspense>
              <ResourceFilters
                currentType={currentType}
                currentCategory={currentCategory}
                currentSearch={currentSearch}
                categories={categories}
              />
            </Suspense>
          </div>

          {/* Resource count */}
          <p className="mb-6 text-sm text-gray-500" aria-live="polite">
            {total === 0 ? 'No resources found.' : `${total} resource${total !== 1 ? 's' : ''}`}
          </p>

          {/* Grid */}
          {resources.length === 0 ? (
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
              {resources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
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
