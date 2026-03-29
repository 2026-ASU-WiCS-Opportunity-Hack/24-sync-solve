import { WebinarCard } from '@/components/knowledge/WebinarCard'
import { createClient } from '@/lib/supabase/server'
import { canEditChapter } from '@/lib/utils/serverAuth'
import type { Webinar } from '@/features/knowledge/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Webinars | WIAL',
  description: 'Watch WIAL webinars and access AI-generated marketing content for each session.',
}

export default async function WebinarsPage() {
  const supabase = await createClient()
  const { data: webinars } = await supabase
    .from('webinars')
    .select('*')
    .eq('is_published', true)
    .order('scheduled_at', { ascending: false })

  const isEditor = await canEditChapter(null)

  return (
    <div className="min-h-screen bg-white pt-16 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12">
          <h1 className="text-wial-navy mb-4 text-4xl font-extrabold">WIAL Webinars</h1>
          <p className="max-w-2xl text-lg text-gray-600">
            Join Action Learning experts from around the globe to discuss the latest methodologies,
            case studies, and coaching best practices.
          </p>
        </div>

        {webinars && webinars.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {(webinars as Webinar[]).map((w) => (
              <WebinarCard key={w.id} webinar={w} canPromote={isEditor} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border-2 border-dashed py-12 text-center text-lg text-gray-500">
            Check back soon for upcoming webinars.
          </p>
        )}
      </div>
    </div>
  )
}
