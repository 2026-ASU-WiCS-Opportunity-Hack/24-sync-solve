import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPageWithBlocks } from '@/features/content/queries/getPageBlocks'
import { EditablePageRendererWrapper as EditablePageRenderer } from '@/components/editor/EditablePageRendererWrapper'
import { canEditChapter } from '@/lib/utils/serverAuth'
import ContactFormBlock from '@/components/blocks/ContactFormBlock'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'About & Contact — WIAL',
  description:
    'Learn about the World Institute for Action Learning — our mission, history, and global impact. Get in touch with us.',
}

export default async function AboutPage() {
  const supabase = await createClient()
  const isEditor = await canEditChapter(null)
  const result = await getPageWithBlocks(supabase, null, 'about', isEditor)

  return (
    <>
      {result ? (
        <EditablePageRenderer initialBlocks={result.blocks} pageId={result.page.id} />
      ) : (
        <div className="bg-white py-20">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h1 className="text-wial-navy text-4xl font-bold">About WIAL</h1>
            <p className="mt-6 text-lg text-gray-600">
              The World Institute for Action Learning (WIAL) is the global authority on Action
              Learning. We certify coaches at four levels — CALC, PALC, SALC, and MALC — ensuring
              the highest standards in the field.
            </p>
            <p className="mt-4 text-gray-600">
              Founded over 30 years ago, WIAL has grown to serve 20+ countries with 500+ certified
              coaches supporting thousands of organizations worldwide.
            </p>
          </div>
        </div>
      )}

      {/* Contact section — always present below the about content */}
      <section id="contact" className="border-t border-gray-100 bg-gray-50">
        <ContactFormBlock content={{ heading: 'Contact WIAL', recipient_email: 'info@wial.edu' }} />
      </section>
    </>
  )
}
