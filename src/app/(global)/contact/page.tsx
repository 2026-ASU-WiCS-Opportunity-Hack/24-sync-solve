import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPageWithBlocks } from '@/features/content/queries/getPageBlocks'
import { EditablePageRendererWrapper as EditablePageRenderer } from '@/components/editor/EditablePageRendererWrapper'
import { canEditChapter } from '@/lib/utils/serverAuth'
import ContactFormBlock from '@/components/blocks/ContactFormBlock'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with WIAL — contact us for inquiries about certification, coaching, or partnerships.',
}

export default async function ContactPage() {
  const supabase = await createClient()
  const isEditor = await canEditChapter(null)
  const result = await getPageWithBlocks(supabase, null, 'contact', isEditor)

  return result ? (
    <EditablePageRenderer initialBlocks={result.blocks} pageId={result.page.id} />
  ) : (
    <>
      <section className="bg-wial-navy py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="text-4xl font-extrabold">Contact WIAL</h1>
          <p className="mt-4 text-white/80">
            Questions about certification, coaching, or partnerships? We&apos;d love to hear from
            you.
          </p>
        </div>
      </section>
      <ContactFormBlock
        content={{ heading: 'Send us a message', recipient_email: 'info@wial.edu' }}
      />
    </>
  )
}
