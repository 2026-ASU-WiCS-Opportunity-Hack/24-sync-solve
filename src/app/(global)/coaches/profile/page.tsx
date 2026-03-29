import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Award, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCoachProfileByUserId } from '@/features/coaches/queries/getCoachById'
import { CoachProfileForm } from '@/components/coaches/CoachProfileForm'
import { CERTIFICATION_LABELS } from '@/lib/utils/constants'
import type { CertificationLevel } from '@/types/database'

export const metadata: Metadata = {
  title: 'My Coach Profile',
  description: 'View and manage your WIAL coach profile.',
}

export const revalidate = 0 // Always fresh for authenticated user

export default async function CoachesProfilePage() {
  const supabase = await createClient()

  // ── Auth guard ─────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/coaches/profile')
  }

  // ── Fetch coach profile ─────────────────────────────────────────────────────
  const coach = await getCoachProfileByUserId(supabase, user.id)

  if (!coach) {
    // User is not a coach — show appropriate message
    return (
      <>
        <section className="bg-wial-navy py-12 text-white">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold">My Coach Profile</h1>
          </div>
        </section>

        <section className="bg-gray-50 py-12">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <Award size={40} className="text-wial-navy mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-wial-navy text-xl font-semibold">No Coach Profile Found</h2>
              <p className="mt-3 text-gray-600">
                You don&apos;t have a coach profile yet. Coach profiles are created by WIAL
                administrators after certification.
              </p>
              <Link
                href="/about"
                className="bg-wial-red hover:bg-wial-red-dark mt-6 inline-block rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
              >
                Learn About Certification
              </Link>
            </div>
          </div>
        </section>
      </>
    )
  }

  const name = coach.profile?.full_name ?? user.email ?? 'Coach'
  const certLabel =
    CERTIFICATION_LABELS[coach.certification_level as CertificationLevel] ??
    coach.certification_level

  return (
    <>
      {/* Header */}
      <section className="bg-wial-navy py-12 text-white">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold">My Coach Profile</h1>
          <p className="mt-2 text-white/70">
            Keep your profile up to date to help organizations find you.
          </p>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-3xl space-y-6 px-6 lg:px-8">
          {/* Profile summary card */}
          <div className="flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            {coach.photo_url ? (
              <div className="relative size-[72px] shrink-0 overflow-hidden rounded-full ring-2 ring-gray-100">
                <Image
                  src={coach.photo_url}
                  alt={`${name}'s profile photo`}
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="bg-wial-navy flex size-[72px] shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
                aria-hidden="true"
              >
                {name[0]?.toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-wial-navy truncate text-lg font-semibold">{name}</p>
              <p className="flex items-center gap-1.5 text-sm text-gray-500">
                <Award size={13} aria-hidden="true" />
                {certLabel}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              {/* Published status */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  coach.is_published ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                }`}
              >
                {coach.is_published ? (
                  <>
                    <Eye size={11} aria-hidden="true" />
                    Published
                  </>
                ) : (
                  <>
                    <EyeOff size={11} aria-hidden="true" />
                    Not published
                  </>
                )}
              </span>

              {/* Verified status */}
              {coach.is_verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  <ShieldCheck size={11} aria-hidden="true" />
                  Verified
                </span>
              )}
            </div>
          </div>

          {/* Public profile link */}
          {coach.is_published && (
            <p className="text-sm text-gray-500">
              Your public profile:{' '}
              <Link
                href={`/coaches/${coach.id}`}
                className="text-wial-red hover:text-wial-red-dark font-medium"
              >
                /coaches/{coach.id}
              </Link>
            </p>
          )}

          {/* Edit form */}
          <CoachProfileForm coach={coach} />
        </div>
      </section>
    </>
  )
}
