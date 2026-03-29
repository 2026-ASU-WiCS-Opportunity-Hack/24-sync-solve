import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPageWithBlocks } from '@/features/content/queries/getPageBlocks'
import { EditablePageRendererWrapper as EditablePageRenderer } from '@/components/editor/EditablePageRendererWrapper'
import { canEditChapter } from '@/lib/utils/serverAuth'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Action Learning resources, publications, and research from WIAL.',
}

export default async function ResourcesPage() {
  const supabase = await createClient()
  const isEditor = await canEditChapter(null)
  const result = await getPageWithBlocks(supabase, null, 'resources', isEditor)

  return result ? (
    <EditablePageRenderer initialBlocks={result.blocks} pageId={result.page.id} />
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
