import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPageWithBlocks } from '@/features/content/queries/getPageBlocks'
import { EditablePageRendererWrapper as EditablePageRenderer } from '@/components/editor/EditablePageRendererWrapper'
import { canEditChapter } from '@/lib/utils/serverAuth'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'About WIAL',
  description:
    'Learn about the World Institute for Action Learning — our mission, history, and global impact in leadership development.',
}

export default async function AboutPage() {
  const supabase = await createClient()
  const isEditor = await canEditChapter(null)
  const result = await getPageWithBlocks(supabase, null, 'about', isEditor)

  return result ? (
    <EditablePageRenderer initialBlocks={result.blocks} pageId={result.page.id} />
  ) : (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="text-wial-navy text-4xl font-bold">About WIAL</h1>
        <p className="mt-6 text-lg text-gray-600">
          The World Institute for Action Learning (WIAL) is the global authority on Action Learning.
          We certify coaches at four levels — CALC, PALC, SALC, and MALC — ensuring the highest
          standards in the field.
        </p>
      </div>
    </div>
  )
}
