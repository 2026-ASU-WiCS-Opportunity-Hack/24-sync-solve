import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import {
  Award,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  CreditCard,
  Settings,
  ExternalLink,
  Receipt,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCoachProfileByUserId } from '@/features/coaches/queries/getCoachById'
import { getUserPayments } from '@/features/payments/queries/getPayments'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { CERTIFICATION_LABELS } from '@/lib/utils/constants'
import type { CertificationLevel } from '@/types/database'

export const metadata: Metadata = { title: 'Dashboard' }

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-700',
  succeeded: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-amber-100 text-amber-700',
}

export const revalidate = 0 // Always fresh — reflects latest profile status

export default async function DashboardPage() {
  const [t, tPayments] = await Promise.all([
    getTranslations('dashboard'),
    getTranslations('payments'),
  ])

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard')

  // ── Fetch user profile ─────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url, chapter_id')
    .eq('id', user.id)
    .single()

  // Super admins belong in /admin, not the dashboard
  if (profile?.role === 'super_admin') {
    redirect('/admin')
  }

  const isCoach = profile?.role === 'coach'
  const isChapterManager = profile?.role === 'chapter_lead' || profile?.role === 'content_editor'

  // ── Fetch coach profile, payment history, chapter slug in parallel ─────────
  const [coachProfile, payments, chapterData] = await Promise.all([
    isCoach ? getCoachProfileByUserId(supabase, user.id) : Promise.resolve(null),
    getUserPayments(supabase, user.id),
    isChapterManager && profile?.chapter_id
      ? supabase.from('chapters').select('slug').eq('id', profile.chapter_id).single()
      : Promise.resolve({ data: null }),
  ])

  const chapterSlug = chapterData?.data?.slug ?? null

  const name = profile?.full_name ?? user.email ?? 'User'
  const certLabel =
    coachProfile &&
    (CERTIFICATION_LABELS[coachProfile.certification_level as CertificationLevel] ??
      coachProfile.certification_level)

  return (
    <>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <section className="bg-wial-navy relative overflow-hidden py-14 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.15),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(204,0,0,0.22),transparent_44%)]"
        />
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="flex items-center gap-5">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={`${name}'s avatar`}
                width={56}
                height={56}
                className="size-14 rounded-full object-cover ring-2 ring-white/30"
              />
            ) : (
              <div
                className="bg-wial-red flex size-14 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white ring-2 ring-white/30"
                aria-hidden="true"
              >
                {name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm text-white/60">{t('welcomeBack')}</p>
              <h1 className="text-2xl font-extrabold">{name}</h1>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-5xl space-y-10 px-6 lg:px-8">
          {/* ── Coach profile card ──────────────────────────────────────── */}
          {isCoach && (
            <div>
              <h2 className="text-wial-navy mb-4 text-lg font-semibold">
                {t('coachProfile.heading')}
              </h2>

              {coachProfile ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Cert + status badges */}
                    <div>
                      <p className="font-semibold text-gray-900">{certLabel}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            coachProfile.is_published
                              ? 'bg-green-50 text-green-700'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          {coachProfile.is_published ? (
                            <Eye size={11} aria-hidden="true" />
                          ) : (
                            <EyeOff size={11} aria-hidden="true" />
                          )}
                          {coachProfile.is_published
                            ? t('coachProfile.statusPublished')
                            : t('coachProfile.statusUnpublished')}
                        </span>
                        {coachProfile.is_verified && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            <ShieldCheck size={11} aria-hidden="true" />
                            {t('coachProfile.statusVerified')}
                          </span>
                        )}
                        {!coachProfile.is_published && (
                          <span className="text-xs text-gray-400">
                            {t('coachProfile.pendingReview')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action links */}
                    <div className="flex flex-wrap gap-3">
                      {coachProfile.is_published && (
                        <Link
                          href={`/coaches/${coachProfile.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {t('coachProfile.viewPublic')}
                          <ExternalLink size={13} aria-hidden="true" />
                        </Link>
                      )}
                      <Link
                        href="/coaches/profile"
                        className="bg-wial-navy hover:bg-wial-navy-dark rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
                      >
                        {t('coachProfile.manageProfile')}
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                  <Award size={32} className="text-wial-navy mx-auto mb-3" aria-hidden="true" />
                  <p className="font-medium text-gray-600">{t('coachProfile.noProfile')}</p>
                  <p className="mt-1 text-sm text-gray-400">{t('coachProfile.noProfileHint')}</p>
                  <Link
                    href="/certification"
                    className="bg-wial-red hover:bg-wial-red-dark mt-5 inline-block rounded-xl px-5 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    {t('coachProfile.learnCertification')}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── Chapter manager card ────────────────────────────────────── */}
          {isChapterManager && chapterSlug && (
            <div>
              <h2 className="text-wial-navy mb-4 text-lg font-semibold">
                {t('chapterManagement.heading')}
              </h2>
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
                <p className="text-sm text-gray-600">{t('chapterManagement.description')}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/${chapterSlug}`}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t('chapterManagement.viewSite')}
                  </Link>
                  <Link
                    href={`/${chapterSlug}/events/manage`}
                    className="bg-wial-navy hover:bg-wial-navy-dark rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    {t('chapterManagement.manageEvents')}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ── Payment history ─────────────────────────────────────────── */}
          <div>
            <h2 className="text-wial-navy mb-4 text-lg font-semibold">
              {tPayments('history.title')}
            </h2>

            {payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                <Receipt size={28} className="mx-auto mb-3 text-gray-300" aria-hidden="true" />
                <p className="text-sm text-gray-500">{tPayments('history.noPayments')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/5">
                <table className="w-full text-sm" aria-label={tPayments('history.title')}>
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left">
                      <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                        {tPayments('history.type')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold text-gray-700">
                        {tPayments('history.amount')}
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                        {tPayments('history.status')}
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                        {tPayments('history.date')}
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                        {tPayments('history.receipt')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {tPayments(
                            `types.${payment.payment_type}` as Parameters<typeof tPayments>[0]
                          ) ?? payment.payment_type}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatCurrency(payment.amount ?? 0, payment.currency ?? 'USD')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${PAYMENT_STATUS_STYLES[payment.status] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {tPayments(
                              `status.${payment.status}` as Parameters<typeof tPayments>[0]
                            ) ?? payment.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {formatDate(payment.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          {payment.receipt_url ? (
                            <a
                              href={payment.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                              aria-label={tPayments('history.receipt')}
                            >
                              {tPayments('history.receipt')}
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Quick links ─────────────────────────────────────────────── */}
          <div>
            <h2 className="text-wial-navy mb-4 text-lg font-semibold">
              {t('quickActions.heading')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {isCoach && (
                <Link
                  href="/coaches/profile"
                  className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="bg-wial-navy flex size-10 shrink-0 items-center justify-center rounded-full text-white">
                    <User size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('quickActions.myProfile')}</p>
                    <p className="text-xs text-gray-500">{t('quickActions.myProfileHint')}</p>
                  </div>
                </Link>
              )}

              <Link
                href="/coaches"
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="bg-wial-red/10 text-wial-red flex size-10 shrink-0 items-center justify-center rounded-full">
                  <Award size={18} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('quickActions.coachDirectory')}</p>
                  <p className="text-xs text-gray-500">{t('quickActions.coachDirectoryHint')}</p>
                </div>
              </Link>

              <Link
                href="/events"
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
                  <CreditCard size={18} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('quickActions.upcomingEvents')}</p>
                  <p className="text-xs text-gray-500">{t('quickActions.upcomingEventsHint')}</p>
                </div>
              </Link>

              <Link
                href="/account/settings"
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                  <Settings size={18} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('quickActions.accountSettings')}</p>
                  <p className="text-xs text-gray-500">{t('quickActions.accountSettingsHint')}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
