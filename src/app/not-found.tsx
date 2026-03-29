import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = { title: '404 — Page Not Found' }

export default async function NotFound() {
  const t = await getTranslations('common')

  return (
    <section className="bg-wial-navy flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center text-white">
      <p className="text-wial-red text-8xl leading-none font-extrabold" aria-hidden="true">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold">{t('notFound')}</h1>
      <p className="mt-2 max-w-md text-white/70">{t('notFoundMessage')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="bg-wial-red hover:bg-wial-red-light rounded-xl px-6 py-3 text-sm font-semibold text-white transition-colors"
        >
          {t('backHome')}
        </Link>
        <Link
          href="/coaches"
          className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Find a Coach
        </Link>
      </div>
    </section>
  )
}
