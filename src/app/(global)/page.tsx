import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getPageWithBlocks } from '@/features/content/queries/getPageBlocks'
import { EditablePageRendererWrapper as EditablePageRenderer } from '@/components/editor/EditablePageRendererWrapper'
import { canEditChapter } from '@/lib/utils/serverAuth'

export const revalidate = 3600

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
  const isEditor = await canEditChapter(null)
  const result = await getPageWithBlocks(supabase, null, 'home', isEditor)

  return result ? (
    <EditablePageRenderer initialBlocks={result.blocks} pageId={result.page.id} />
  ) : (
    <FallbackHomepage />
  )
}

async function FallbackHomepage() {
  const t = await getTranslations('home')

  const stats = [
    { label: t('stats.countries'), value: '20+' },
    { label: t('stats.coaches'), value: '500+' },
    { label: t('stats.organizations'), value: '1,000+' },
    { label: t('stats.years'), value: '30+' },
  ]

  const certLevels = [
    {
      code: 'CALC',
      name: 'Certified Action Learning Coach',
      desc: 'Entry-level certification for coaches new to Action Learning facilitation.',
    },
    {
      code: 'PALC',
      name: 'Professional Action Learning Coach',
      desc: 'For coaches with demonstrated practice and 30 hours of facilitation.',
    },
    {
      code: 'SALC',
      name: 'Senior Action Learning Coach',
      desc: 'For experienced coaches with 150+ hours and peer review.',
    },
    {
      code: 'MALC',
      name: 'Master Action Learning Coach',
      desc: 'The highest designation, recognizing mastery and significant contribution to the field.',
    },
  ]

  return (
    <>
      {/* Hero */}
      <section className="bg-wial-navy relative overflow-hidden text-white">
        <div className="bg-wial-red absolute inset-s-0 top-0 h-full w-1.5" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              {t('hero.headline')}
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/80">{t('hero.subheadline')}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/coaches"
                className="bg-wial-red hover:bg-wial-red-dark rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors"
              >
                {t('hero.ctaPrimary')}
              </Link>
              <Link
                href="/about"
                className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t('hero.ctaSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-wial-navy border-t border-white/10 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
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
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h2 className="text-wial-navy text-3xl font-bold tracking-tight sm:text-4xl">
            {t('about.heading')}
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">{t('about.body')}</p>
          <Link
            href="/about"
            className="text-wial-red hover:text-wial-red-dark mt-8 inline-block text-sm font-semibold"
          >
            {t('about.learnMore')}
          </Link>
        </div>
      </section>

      {/* Certification levels */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-wial-navy text-3xl font-bold tracking-tight sm:text-4xl">
              {t('certification.heading')}
            </h2>
            <p className="mt-4 text-lg text-gray-600">{t('certification.body')}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {certLevels.map((level) => (
              <div
                key={level.code}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <span className="text-wial-red text-xl font-extrabold">{level.code}</span>
                <p className="mt-1 text-sm font-semibold text-gray-900">{level.name}</p>
                <p className="mt-3 text-xs leading-relaxed text-gray-500">{level.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/about"
              className="bg-wial-navy hover:bg-wial-navy-dark inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors"
            >
              {t('certification.cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* Global chapters */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="text-wial-navy text-3xl font-bold tracking-tight sm:text-4xl">
            {t('chapters.heading')}
          </h2>
          <p className="mt-4 text-lg text-gray-600">{t('chapters.body')}</p>
          <Link
            href="/coaches"
            className="bg-wial-red hover:bg-wial-red-dark mt-8 inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            {t('chapters.cta')}
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-wial-navy py-20 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-white">{t('finalCta.heading')}</h2>
          <p className="mt-4 text-white/70">{t('finalCta.body')}</p>
          <Link
            href="/coaches"
            className="bg-wial-red hover:bg-wial-red-dark mt-8 inline-block rounded-lg px-8 py-3.5 text-sm font-semibold text-white transition-colors"
          >
            {t('finalCta.cta')}
          </Link>
        </div>
      </section>
    </>
  )
}
