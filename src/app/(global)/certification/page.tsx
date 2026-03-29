import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getPageWithBlocks } from '@/features/content/queries/getPageBlocks'
import { EditablePageRendererWrapper as EditablePageRenderer } from '@/components/editor/EditablePageRendererWrapper'
import { canEditChapter } from '@/lib/utils/serverAuth'
import { CERTIFICATION_LABELS, CERTIFICATION_ORDER } from '@/lib/utils/constants'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Certification',
  description:
    'Earn globally recognized Action Learning coach certification at four progressive levels: CALC, PALC, SALC, and MALC.',
}

export default async function CertificationPage() {
  const supabase = await createClient()
  const isEditor = await canEditChapter(null)
  const result = await getPageWithBlocks(supabase, null, 'certification', isEditor)

  return result ? (
    <EditablePageRenderer initialBlocks={result.blocks} pageId={result.page.id} />
  ) : (
    <FallbackCertification />
  )
}

function FallbackCertification() {
  return (
    <>
      <section className="bg-wial-navy py-16 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h1 className="text-4xl font-extrabold text-white">Action Learning Certification</h1>
          <p className="mt-4 text-lg text-white/80">
            Earn globally recognized certification as an Action Learning coach at four progressive
            levels.
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="text-wial-navy mb-10 text-3xl font-bold">Certification Levels</h2>
          <div className="space-y-8">
            {CERTIFICATION_ORDER.map((level, i) => (
              <div key={level} className="rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <span className="bg-wial-red flex size-8 items-center justify-center rounded-full text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="text-wial-navy text-lg font-bold">
                    {level} — {CERTIFICATION_LABELS[level]}
                  </h3>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  {level === 'CALC' &&
                    'Entry-level certification for practitioners new to Action Learning. Complete 3 supervised sets to qualify.'}
                  {level === 'PALC' &&
                    'For coaches with demonstrated competency across diverse organizational contexts. Requires 5 sets logged.'}
                  {level === 'SALC' &&
                    'Recognizes mastery in complex organizational settings. Requires 8+ sets and peer review.'}
                  {level === 'MALC' &&
                    'The highest WIAL certification, awarded to coaches who have demonstrated exceptional mastery and contribution to the field.'}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/coaches"
              className="bg-wial-red hover:bg-wial-red-dark rounded-lg px-8 py-3 text-sm font-semibold text-white transition-colors"
            >
              Find a Certified Coach
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
