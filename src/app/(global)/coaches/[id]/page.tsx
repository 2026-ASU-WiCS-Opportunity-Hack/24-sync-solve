import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink, Mail, MapPin, Award, Clock, Calendar, Languages } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCoachById } from '@/features/coaches/queries/getCoachById'
import { CERTIFICATION_LABELS, CERTIFICATION_ORDER } from '@/lib/utils/constants'
import type { CertificationLevel } from '@/types/database'
import { formatDate } from '@/lib/utils/format'

export const revalidate = 60

interface CoachProfilePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CoachProfilePageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const coach = await getCoachById(supabase, id)

  if (!coach) return { title: 'Coach Not Found' }

  const name = coach.profile?.full_name ?? 'Coach'
  const certLabel =
    CERTIFICATION_LABELS[coach.certification_level as CertificationLevel] ??
    coach.certification_level

  return {
    title: `${name} — ${certLabel}`,
    description:
      coach.bio?.slice(0, 160) ??
      `${name} is a ${certLabel} specializing in Action Learning${coach.location_country ? ` based in ${coach.location_country}` : ''}.`,
  }
}

/** Certification level color map */
const CERT_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  CALC: { bg: 'bg-blue-50', text: 'text-blue-800', ring: 'ring-blue-200' },
  PALC: { bg: 'bg-green-50', text: 'text-green-800', ring: 'ring-green-200' },
  SALC: { bg: 'bg-purple-50', text: 'text-purple-800', ring: 'ring-purple-200' },
  MALC: { bg: 'bg-amber-50', text: 'text-amber-800', ring: 'ring-amber-200' },
}

export default async function CoachProfilePage({ params }: CoachProfilePageProps) {
  const { id } = await params
  const supabase = await createClient()
  const coach = await getCoachById(supabase, id)

  if (!coach) notFound()

  const name = coach.profile?.full_name ?? 'Coach'
  const certLabel =
    CERTIFICATION_LABELS[coach.certification_level as CertificationLevel] ??
    coach.certification_level
  const certColors = CERT_COLORS[coach.certification_level as CertificationLevel] ?? {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    ring: 'ring-gray-200',
  }
  const certRank = CERTIFICATION_ORDER.indexOf(
    coach.certification_level as (typeof CERTIFICATION_ORDER)[number]
  )

  return (
    <>
      {/* Hero section */}
      <section className="bg-wial-navy py-12 text-white">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <Link
            href="/coaches"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
          >
            ← Back to Coach Directory
          </Link>

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="shrink-0">
              {coach.photo_url ? (
                <Image
                  src={coach.photo_url}
                  alt={`${name}'s profile photo`}
                  width={120}
                  height={120}
                  className="size-28 rounded-full object-cover shadow-lg ring-4 ring-white/20"
                />
              ) : (
                <div
                  className="flex size-28 items-center justify-center rounded-full bg-white/10 text-4xl font-bold text-white shadow-lg ring-4 ring-white/20"
                  aria-hidden="true"
                >
                  {name[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Basic info */}
            <div>
              <h1 className="text-3xl font-extrabold">{name}</h1>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                {/* Certification badge */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${certColors.bg} ${certColors.text} ${certColors.ring}`}
                >
                  <Award size={14} aria-hidden="true" />
                  {certLabel}
                </span>

                {/* Chapter */}
                {coach.chapter && (
                  <Link
                    href={`/${coach.chapter.slug}`}
                    className="text-sm text-white/70 hover:text-white"
                  >
                    {coach.chapter.name} Chapter
                  </Link>
                )}
              </div>

              {/* Location */}
              {(coach.location_city || coach.location_country) && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
                  <MapPin size={14} aria-hidden="true" />
                  <span>
                    {[coach.location_city, coach.location_country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left column: sidebar */}
            <aside className="space-y-6 lg:col-span-1">
              {/* Certification details */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-wial-navy mb-4 text-sm font-semibold tracking-wider uppercase">
                  Certification
                </h2>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Level</dt>
                    <dd className="mt-0.5 font-medium text-gray-900">
                      {coach.certification_level} — {certLabel}
                    </dd>
                  </div>
                  {certRank >= 0 && (
                    <div>
                      <dt className="sr-only">Certification Progress</dt>
                      <dd>
                        <div
                          className="flex gap-1"
                          aria-label={`Level ${certRank + 1} of ${CERTIFICATION_ORDER.length}`}
                        >
                          {CERTIFICATION_ORDER.map((level, i) => (
                            <div
                              key={level}
                              className={`h-1.5 flex-1 rounded-full ${i <= certRank ? 'bg-wial-red' : 'bg-gray-200'}`}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                      </dd>
                    </div>
                  )}
                  {coach.certification_date && (
                    <div>
                      <dt className="text-gray-500">Certified Since</dt>
                      <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-gray-900">
                        <Calendar size={13} aria-hidden="true" />
                        {formatDate(coach.certification_date)}
                      </dd>
                    </div>
                  )}
                  {coach.recertification_due && (
                    <div>
                      <dt className="text-gray-500">Recertification Due</dt>
                      <dd className="mt-0.5 font-medium text-gray-900">
                        {formatDate(coach.recertification_due)}
                      </dd>
                    </div>
                  )}
                  {coach.coaching_hours != null && (
                    <div>
                      <dt className="text-gray-500">Coaching Hours</dt>
                      <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-gray-900">
                        <Clock size={13} aria-hidden="true" />
                        {coach.coaching_hours.toLocaleString()} hrs
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Languages */}
              {coach.languages.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-wial-navy mb-3 flex items-center gap-1.5 text-sm font-semibold tracking-wider uppercase">
                    <Languages size={14} aria-hidden="true" />
                    Languages
                  </h2>
                  <ul className="flex flex-wrap gap-2" aria-label="Languages">
                    {coach.languages.map((lang) => (
                      <li
                        key={lang}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                      >
                        {lang}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Contact */}
              {(coach.contact_email || coach.linkedin_url) && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-wial-navy mb-3 text-sm font-semibold tracking-wider uppercase">
                    Contact
                  </h2>
                  <ul className="space-y-2 text-sm">
                    {coach.contact_email && (
                      <li>
                        <a
                          href={`mailto:${coach.contact_email}`}
                          className="text-wial-red hover:text-wial-red-dark flex items-center gap-2"
                          aria-label={`Email ${name}`}
                        >
                          <Mail size={14} aria-hidden="true" />
                          {coach.contact_email}
                        </a>
                      </li>
                    )}
                    {coach.linkedin_url && (
                      <li>
                        <a
                          href={coach.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-wial-red hover:text-wial-red-dark flex items-center gap-2"
                          aria-label={`${name}'s LinkedIn profile (opens in new tab)`}
                        >
                          <ExternalLink size={14} aria-hidden="true" />
                          LinkedIn Profile
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </aside>

            {/* Right column: main content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Bio */}
              {coach.bio && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-wial-navy mb-4 text-lg font-semibold">About</h2>
                  <p className="leading-relaxed whitespace-pre-wrap text-gray-700">{coach.bio}</p>
                </div>
              )}

              {/* Specializations */}
              {coach.specializations.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-wial-navy mb-4 text-lg font-semibold">Specializations</h2>
                  <ul className="flex flex-wrap gap-2" aria-label="Specializations">
                    {coach.specializations.map((spec) => (
                      <li
                        key={spec}
                        className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-medium text-gray-700"
                      >
                        {spec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Chapter info */}
              {coach.chapter && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-wial-navy mb-3 text-lg font-semibold">Chapter</h2>
                  <p className="text-gray-600">
                    {name} is a member of the{' '}
                    <Link
                      href={`/${coach.chapter.slug}`}
                      className="text-wial-red hover:text-wial-red-dark font-medium"
                    >
                      WIAL {coach.chapter.name} Chapter
                    </Link>
                    . Visit the chapter page for regional events, contact information, and
                    chapter-specific resources.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
