import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Award, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCoachById } from '@/features/coaches/queries/getCoachById'
import { getCoursesForCoach } from '@/features/resources/queries/getCoachCourseMappings'
import { CoachProfileView } from '@/components/coaches/CoachProfileView'
import { CERTIFICATION_LABELS } from '@/lib/utils/constants'
import type { CertificationLevel } from '@/types/database'

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

/** Certification level color map for the hero badge */
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
  const courses = await getCoursesForCoach(supabase, coach.id)

  return (
    <>
      {/* ── Hero section ──────────────────────────────────────────────────── */}
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
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${certColors.bg} ${certColors.text} ${certColors.ring}`}
                >
                  <Award size={14} aria-hidden="true" />
                  {certLabel}
                </span>

                {coach.chapter && (
                  <Link
                    href={`/${coach.chapter.slug}`}
                    className="text-sm text-white/70 hover:text-white"
                  >
                    {coach.chapter.name} Chapter
                  </Link>
                )}
              </div>

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

      {/* ── Profile content ───────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <CoachProfileView coach={coach} courses={courses} />
        </div>
      </section>
    </>
  )
}
