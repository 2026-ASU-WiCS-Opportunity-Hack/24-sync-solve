import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPageWithBlocks } from '@/features/content/queries/getPageBlocks'
import { PageRenderer } from '@/components/common/PageRenderer'

export const revalidate = 3600 // 1 hour ISR

export const metadata: Metadata = {
  title: 'WIAL — World Institute for Action Learning',
  description:
    'WIAL certifies Action Learning coaches across 20+ countries. Find a coach, get certified, or join a chapter near you.',
  openGraph: {
    title: 'WIAL — World Institute for Action Learning',
    description:
      'Transforming leaders through the power of Action Learning. Certified coaches in 20+ countries.',
  },
}

export default async function GlobalHomePage() {
  const supabase = await createClient()
  const result = await getPageWithBlocks(supabase, null, 'home')

  return (
    <>
      {result ? (
        <PageRenderer blocks={result.blocks} />
      ) : (
        /* Fallback content when no DB data available */
        <FallbackHomepage />
      )}
    </>
  )
}

function FallbackHomepage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-wial-navy relative overflow-hidden text-white">
        <div className="bg-wial-red absolute start-0 top-0 h-full w-1.5" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Transforming Leaders Through Action Learning
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/80">
              WIAL certifies Action Learning coaches across 20+ countries, empowering organizations
              to solve complex challenges through collaborative problem-solving.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/coaches"
                className="bg-wial-red hover:bg-wial-red-dark rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors"
              >
                Find a Coach
              </a>
              <a
                href="/certification"
                className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Get Certified
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-wial-navy py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              { label: 'Countries', value: '20+' },
              { label: 'Certified Coaches', value: '500+' },
              { label: 'Organizations Served', value: '1,000+' },
              { label: 'Years of Impact', value: '30+' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="order-2 mt-2 text-sm font-medium text-white/70">{stat.label}</dt>
                <dd className="text-wial-red order-1 text-4xl font-extrabold tracking-tight sm:text-5xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* What is Action Learning */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h2 className="text-wial-navy text-3xl font-bold tracking-tight sm:text-4xl">
            What is Action Learning?
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Action Learning is a process that involves a small group working on real problems,
            taking action, and learning as individuals and as a team. WIAL is the global leader in
            Action Learning certification, having trained coaches in organizations across every
            continent.
          </p>
          <a
            href="/about"
            className="text-wial-red hover:text-wial-red-dark mt-8 inline-block text-sm font-semibold"
          >
            Learn more about WIAL →
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-wial-navy py-16 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-white">Ready to Transform Your Organization?</h2>
          <p className="mt-4 text-white/70">
            Join the global community of Action Learning coaches and practitioners.
          </p>
          <a
            href="/coaches"
            className="bg-wial-red hover:bg-wial-red-dark mt-8 inline-block rounded-lg px-8 py-3.5 text-sm font-semibold text-white transition-colors"
          >
            Find Your Chapter
          </a>
        </div>
      </section>
    </>
  )
}
