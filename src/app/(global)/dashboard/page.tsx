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
  ExternalLink,
  Receipt,
  Building2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { UserMenu } from '@/components/layout/UserMenu'
import { getCoachProfileByUserId } from '@/features/coaches/queries/getCoachById'
import { getUserPayments } from '@/features/payments/queries/getPayments'
import { getCertificationProgress } from '@/features/resources/queries/getCertificationProgress'
import { CertificationProgressSection } from '@/components/resources/CertificationProgressSection'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { CERTIFICATION_LABELS } from '@/lib/utils/constants'
import type { CertificationLevel, UserRole } from '@/types/database'
import type { AuthUser, MembershipStatus } from '@/types'

export const metadata: Metadata = { title: 'Dashboard' }

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-700',
  succeeded: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-amber-100 text-amber-700',
}

export const revalidate = 0

interface ManagedChapter {
  id: string
  name: string
  slug: string
  roles: UserRole[]
}

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
    .select(
      'role, full_name, avatar_url, chapter_id, is_suspended, membership_status, membership_expires_at'
    )
    .eq('id', user.id)
    .single()

  // Redirect suspended accounts
  if (profile?.is_suspended) redirect('/suspended')

  // Super admins belong in /admin
  if (profile?.role === 'super_admin') redirect('/admin')

  const isCoach = profile?.role === 'coach'

  // ── Parallel data fetch ────────────────────────────────────────────────────
  const [coachProfile, payments, chapterRolesResult, pendingAppResult, certProgress] =
    await Promise.all([
      isCoach ? getCoachProfileByUserId(supabase, user.id) : Promise.resolve(null),
      getUserPayments(supabase, user.id),
      // Fetch all active chapter roles for multi-chapter management (Gap C)
      supabase
        .from('user_chapter_roles')
        .select('role, chapter:chapters!user_chapter_roles_chapter_id_fkey(id, name, slug)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('role', ['chapter_lead', 'content_editor']),
      // Check for pending coach application (Gap G — show CTA only if none pending)
      !isCoach
        ? supabase
            .from('coach_applications')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      getCertificationProgress(supabase, user.id),
    ])

  // ── Build managed chapters list (Gap C) ────────────────────────────────────
  const chaptersMap = new Map<string, ManagedChapter>()

  for (const row of chapterRolesResult.data ?? []) {
    const chap = row.chapter as { id: string; name: string; slug: string } | null
    if (!chap) continue
    const existing = chaptersMap.get(chap.id)
    if (existing) {
      existing.roles.push(row.role as UserRole)
    } else {
      chaptersMap.set(chap.id, {
        id: chap.id,
        name: chap.name,
        slug: chap.slug,
        roles: [row.role as UserRole],
      })
    }
  }

  // Also include profile.chapter_id if chapter_lead globally
  if (
    (profile?.role === 'chapter_lead' || profile?.role === 'content_editor') &&
    profile.chapter_id &&
    !chaptersMap.has(profile.chapter_id)
  ) {
    const { data: primaryChap } = await supabase
      .from('chapters')
      .select('id, name, slug')
      .eq('id', profile.chapter_id)
      .single()
    if (primaryChap) {
      chaptersMap.set(primaryChap.id, {
        id: primaryChap.id,
        name: primaryChap.name,
        slug: primaryChap.slug,
        roles: [profile.role as UserRole],
      })
    }
  }

  const managedChapters = Array.from(chaptersMap.values())

  // ── Derived state ──────────────────────────────────────────────────────────
  const hasPendingApp = !!pendingAppResult?.data
  const showApplyCTA = !isCoach && !hasPendingApp && profile?.role === 'user'

  const membershipStatus = profile?.membership_status ?? 'none'
  const membershipActive = membershipStatus === 'active'

  const name = profile?.full_name ?? user.email ?? 'User'
  const certLabel =
    coachProfile &&
    (CERTIFICATION_LABELS[coachProfile.certification_level as CertificationLevel] ??
      coachProfile.certification_level)

  // Build AuthUser for UserMenu (same shape as Header.tsx)
  const authUser: AuthUser = {
    id: user.id,
    email: user.email ?? '',
    role: (profile?.role ?? 'user') as UserRole,
    chapterId: profile?.chapter_id ?? null,
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    isSuspended: false,
    membershipStatus: (profile?.membership_status ?? 'none') as MembershipStatus,
    chapterRoles: {},
  }

  return (
    <>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <section className="bg-wial-navy py-12 text-white">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              {profile?.avatar_url ? (
                <div className="relative size-14 overflow-hidden rounded-full ring-2 ring-white/30">
                  <Image
                    src={profile.avatar_url}
                    alt={`${name}'s avatar`}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
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

            {/* Right side: membership badge + account menu */}
            <div className="flex items-center gap-3">
              {membershipActive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-900/40 px-3 py-1.5 text-sm font-medium text-green-300 ring-1 ring-green-500/30">
                  <CheckCircle2 size={14} aria-hidden="true" />
                  Member
                  {profile?.membership_expires_at && (
                    <span className="text-xs text-green-400/70">
                      · expires {formatDate(profile.membership_expires_at)}
                    </span>
                  )}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white/60 ring-1 ring-white/20">
                  <AlertCircle size={14} aria-hidden="true" />
                  No membership
                </span>
              )}
              {/* Account menu — consistent with other page headers */}
              <UserMenu user={authUser} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-5xl space-y-10 px-6 lg:px-8">
          {/* ── Coach profile card ──────────────────────────────────────── */}
          {isCoach && (
            <div>
              <h2 className="text-wial-navy mb-4 text-lg font-semibold">
                {t('coachProfile.heading')}
              </h2>

              {coachProfile ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
                        {coachProfile.profile_visibility_suspended && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                            <EyeOff size={11} aria-hidden="true" />
                            Visibility suspended
                          </span>
                        )}
                        {!coachProfile.is_published &&
                          !coachProfile.profile_visibility_suspended && (
                            <span className="text-xs text-gray-400">
                              {t('coachProfile.pendingReview')}
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Action links */}
                    <div className="flex flex-wrap gap-3">
                      {coachProfile.is_published && !coachProfile.profile_visibility_suspended && (
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
                    href="/about"
                    className="bg-wial-red hover:bg-wial-red-dark mt-5 inline-block rounded-xl px-5 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    {t('coachProfile.learnCertification')}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── Certification progress ──────────────────────────────────── */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-wial-navy text-lg font-semibold">Certification Progress</h2>
              <Link
                href="/resources"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                <BookOpen size={14} aria-hidden="true" />
                Browse Resources
              </Link>
            </div>
            <CertificationProgressSection progress={certProgress} />
          </div>

          {/* ── Apply to be a Coach CTA (Gap G) ─────────────────────────── */}
          {showApplyCTA && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-wial-navy flex size-12 shrink-0 items-center justify-center rounded-full text-white">
                    <Award size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Become a WIAL Certified Coach</p>
                    <p className="mt-0.5 text-sm text-gray-600">
                      Have your Credly badge? Apply to join our certified coach directory.
                    </p>
                  </div>
                </div>
                <Link
                  href="/coaches/apply"
                  className="bg-wial-navy hover:bg-wial-navy-dark shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                >
                  Apply Now
                </Link>
              </div>
            </div>
          )}

          {/* ── Pending coach application notice ────────────────────────── */}
          {hasPendingApp && !isCoach && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-3">
                <Award size={20} className="shrink-0 text-amber-600" aria-hidden="true" />
                <div>
                  <p className="font-medium text-amber-900">Coach application pending</p>
                  <p className="mt-0.5 text-sm text-amber-700">
                    Your application is under review. You will be notified when a decision is made.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Chapter management cards (Gap C: multi-chapter) ─────────── */}
          {managedChapters.length > 0 && (
            <div>
              <h2 className="text-wial-navy mb-4 text-lg font-semibold">
                {t('chapterManagement.heading')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {managedChapters.map((chap) => (
                  <div
                    key={chap.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                        <Building2 size={18} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-gray-900">{chap.name}</p>
                        <p className="text-xs text-gray-500">
                          {chap.roles
                            .map((r) =>
                              r === 'chapter_lead'
                                ? 'Chapter Admin'
                                : r === 'content_editor'
                                  ? 'Content Editor'
                                  : r
                            )
                            .join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/${chap.slug}`}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {t('chapterManagement.viewSite')}
                      </Link>
                      <Link
                        href={`/${chap.slug}/manage`}
                        className="bg-wial-navy hover:bg-wial-navy-dark rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                      >
                        Manage Chapter
                      </Link>
                    </div>
                  </div>
                ))}
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
              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
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
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
