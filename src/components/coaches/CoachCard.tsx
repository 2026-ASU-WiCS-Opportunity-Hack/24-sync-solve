import Image from 'next/image'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import type { CoachWithBasicProfile } from '@/features/coaches/queries/getCoaches'
import { CERTIFICATION_LABELS } from '@/lib/utils/constants'
import { truncate } from '@/lib/utils/format'

interface CoachCardProps {
  coach: CoachWithBasicProfile
}

/** Certification level badge color */
const CERT_COLORS: Record<string, string> = {
  CALC: 'bg-blue-100 text-blue-800',
  PALC: 'bg-green-100 text-green-800',
  SALC: 'bg-purple-100 text-purple-800',
  MALC: 'bg-amber-100 text-amber-800',
}

export function CoachCard({ coach }: CoachCardProps) {
  const name = coach.profile?.full_name ?? 'Coach'
  const certColor = CERT_COLORS[coach.certification_level] ?? 'bg-gray-100 text-gray-700'

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <Link
        href={`/coaches/${coach.id}`}
        className="focus-visible:ring-wial-navy block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-label={`View ${name}'s coach profile`}
      >
        <div
          className="from-wial-navy to-wial-navy-light h-8 bg-gradient-to-r"
          aria-hidden="true"
        />

        {/* Photo */}
        <div className="-mt-4 flex justify-center pb-2">
          {coach.photo_url ? (
            <Image
              src={coach.photo_url}
              alt={`${name}'s profile photo`}
              width={80}
              height={80}
              className="size-20 rounded-full object-cover shadow-sm ring-4 ring-white"
            />
          ) : (
            <span
              className="bg-wial-navy flex size-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-sm ring-4 ring-white"
              aria-hidden="true"
            >
              {name[0]?.toUpperCase()}
            </span>
          )}
        </div>

        <div className="px-4 pb-5 text-center">
          {/* Name */}
          <h2 className="text-wial-navy text-base leading-snug font-semibold group-hover:underline">
            {name}
          </h2>

          {/* Certification badge */}
          <span
            className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${certColor}`}
            title={CERTIFICATION_LABELS[coach.certification_level]}
          >
            {coach.certification_level}
          </span>

          {/* Location */}
          {(coach.location_city || coach.location_country) && (
            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-500">
              <MapPin size={11} aria-hidden="true" />
              <span>
                {[coach.location_city, coach.location_country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {/* Bio excerpt */}
          {coach.bio && (
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{truncate(coach.bio, 120)}</p>
          )}

          {/* Specializations */}
          {coach.specializations.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1" aria-label="Specializations">
              {coach.specializations.slice(0, 3).map((spec) => (
                <span
                  key={spec}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {spec}
                </span>
              ))}
              {coach.specializations.length > 3 && (
                <span className="text-xs text-gray-400">+{coach.specializations.length - 3}</span>
              )}
            </div>
          )}

          {/* View profile CTA */}
          <span className="bg-wial-navy group-hover:bg-wial-navy-light mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-colors">
            View profile
          </span>
        </div>
      </Link>
    </article>
  )
}
