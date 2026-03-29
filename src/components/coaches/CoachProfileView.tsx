import { ExternalLink, Mail, MapPin, Award, Clock, Calendar, Languages } from 'lucide-react'
import Link from 'next/link'
import { CERTIFICATION_LABELS, CERTIFICATION_ORDER } from '@/lib/utils/constants'
import { formatDate } from '@/lib/utils/format'
import type { CoachFullProfile } from '@/features/coaches/queries/getCoachById'
import type { CoursePreview } from '@/features/resources/queries/getCoachCourseMappings'
import type { CertificationLevel } from '@/types/database'

/** Certification level color map — mirrors the public coach detail page */
const CERT_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  CALC: { bg: 'bg-blue-50', text: 'text-blue-800', ring: 'ring-blue-200' },
  PALC: { bg: 'bg-green-50', text: 'text-green-800', ring: 'ring-green-200' },
  SALC: { bg: 'bg-purple-50', text: 'text-purple-800', ring: 'ring-purple-200' },
  MALC: { bg: 'bg-amber-50', text: 'text-amber-800', ring: 'ring-amber-200' },
}

interface CoachProfileViewProps {
  coach: CoachFullProfile
  courses?: CoursePreview[]
}

/**
 * CoachProfileView — Server Component.
 * Renders the full two-column coach profile content grid
 * (certification sidebar + bio/specializations main column).
 *
 * Used by:
 *   - /coaches/[id]/page.tsx  (public profile page)
 *   - /admin/coaches/[id]/page.tsx  (admin review page)
 *
 * The page-level hero (name, photo, back link) is intentionally kept
 * in each consuming page so each context can style it appropriately.
 */
export function CoachProfileView({ coach, courses = [] }: CoachProfileViewProps) {
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
    <div className="grid gap-8 lg:grid-cols-3">
      {/* ── Left column: sidebar ───────────────────────────────────────────── */}
      <aside className="space-y-6 lg:col-span-1">
        {/* Certification badge + progress */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-wial-navy mb-1 text-xs font-semibold tracking-wider uppercase">
            Certification
          </h2>

          {/* Level badge */}
          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${certColors.bg} ${certColors.text} ${certColors.ring}`}
            >
              <Award size={13} aria-hidden="true" />
              {certLabel}
            </span>
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Level</dt>
              <dd className="mt-0.5 font-medium text-gray-900">
                {coach.certification_level} — {certLabel}
              </dd>
            </div>

            {/* Progress bar */}
            {certRank >= 0 && (
              <div>
                <dt className="sr-only">Certification progress</dt>
                <dd>
                  <div
                    className="flex gap-1"
                    aria-label={`Level ${certRank + 1} of ${CERTIFICATION_ORDER.length}`}
                  >
                    {CERTIFICATION_ORDER.map((level, i) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full ${
                          i <= certRank ? 'bg-wial-red' : 'bg-gray-200'
                        }`}
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
            <h2 className="text-wial-navy mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
              <Languages size={13} aria-hidden="true" />
              Languages
            </h2>
            <ul className="flex flex-wrap gap-2" aria-label="Languages spoken">
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
            <h2 className="text-wial-navy mb-3 text-xs font-semibold tracking-wider uppercase">
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

        {/* Location (when not displayed in a hero) */}
        {(coach.location_city || coach.location_country) && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-wial-navy mb-3 text-xs font-semibold tracking-wider uppercase">
              Location
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-gray-700">
              <MapPin size={14} aria-hidden="true" />
              {[coach.location_city, coach.location_country].filter(Boolean).join(', ')}
            </p>
          </div>
        )}
      </aside>

      {/* ── Right column: main content ─────────────────────────────────────── */}
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

        {/* Chapter */}
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

        {courses.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-wial-navy mb-4 text-lg font-semibold">
              Courses This Coach Teaches
            </h2>
            <ul className="space-y-2">
              {courses.map((course) => (
                <li
                  key={course.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{course.title}</p>
                    <p className="text-xs text-gray-500">{course.type.toUpperCase()}</p>
                  </div>
                  <a
                    href={course.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-wial-red hover:text-wial-red-dark inline-flex items-center gap-1 text-xs font-semibold"
                  >
                    View Course
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty state — show something when profile is sparse */}
        {!coach.bio &&
          coach.specializations.length === 0 &&
          !coach.chapter &&
          courses.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <p className="text-sm text-gray-500">Profile details have not been filled in yet.</p>
            </div>
          )}
      </div>
    </div>
  )
}
