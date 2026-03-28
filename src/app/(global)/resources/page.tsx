import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPageWithBlocks } from '@/features/content/queries/getPageBlocks'
import { PageRenderer } from '@/components/common/PageRenderer'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Action Learning resources, publications, and research from WIAL.',
}

export default async function ResourcesPage() {
  const supabase = await createClient()
  const result = await getPageWithBlocks(supabase, null, 'resources')

  return result ? (
    <PageRenderer blocks={result.blocks} />
  ) : (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="text-wial-navy text-4xl font-bold">Resources</h1>
        <p className="mt-6 text-gray-600">
          Explore our library of Action Learning resources, research, and publications.
        </p>
      </div>
    </div>
  )
}
