import Link from 'next/link'
import Image from 'next/image'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCoaches } from '@/features/coaches/queries/getCoaches'

const coachListSchema = z.object({
  heading: z.string().optional().default('Our Certified Coaches'),
  limit: z.number().optional().default(6),
})

interface CoachListBlockProps {
  content: Record<string, unknown>
  chapterId?: string | null
}

export default async function CoachListBlock({ content, chapterId }: CoachListBlockProps) {
  const parsed = coachListSchema.safeParse(content)
  const data = parsed.success ? parsed.data : coachListSchema.parse({})

  const supabase = await createClient()
  const { items: coaches } = await getCoaches(supabase, {
    chapterId: chapterId ?? undefined,
    limit: data.limit,
  })

  if (coaches.length === 0) return null

  return (
    <section aria-label={data.heading} className="bg-gray-50 py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-wial-navy text-3xl font-bold">{data.heading}</h2>
          <Link
            href={chapterId ? 'coaches' : '/coaches'}
            className="text-wial-red hover:text-wial-red-dark text-sm font-medium"
          >
            View all →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {coaches.map((coach) => (
            <article
              key={coach.id}
              className="shadow-card hover:shadow-card-hover rounded-xl bg-white p-4 text-center transition-shadow"
            >
              {coach.photo_url ? (
                <Image
                  src={coach.photo_url}
                  alt={`${coach.profile?.full_name ?? 'Coach'}'s photo`}
                  width={80}
                  height={80}
                  className="mx-auto size-20 rounded-full object-cover"
                />
              ) : (
                <span className="bg-wial-navy mx-auto flex size-20 items-center justify-center rounded-full text-2xl font-bold text-white">
                  {(coach.profile?.full_name ?? 'C')[0]}
                </span>
              )}

              <h3 className="text-wial-navy mt-3 text-sm font-semibold">
                {coach.profile?.full_name ?? 'Coach'}
              </h3>

              <p className="text-wial-red mt-1 text-xs font-medium">{coach.certification_level}</p>

              {coach.location_city && (
                <p className="mt-1 text-xs text-gray-500">
                  {coach.location_city}
                  {coach.location_country && `, ${coach.location_country}`}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
