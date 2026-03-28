import Image from 'next/image'
import { z } from 'zod'

const teamGridSchema = z.object({
  heading: z.string().optional(),
  members: z
    .array(
      z.object({
        name: z.string(),
        title: z.string().optional(),
        bio: z.string().optional(),
        photo_url: z.string().optional(),
      })
    )
    .default([]),
})

interface TeamGridBlockProps {
  content: Record<string, unknown>
}

export default function TeamGridBlock({ content }: TeamGridBlockProps) {
  const parsed = teamGridSchema.safeParse(content)
  const data = parsed.success ? parsed.data : teamGridSchema.parse({})

  if (data.members.length === 0) return null

  return (
    <section aria-label={data.heading ?? 'Team'} className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {data.heading && (
          <h2 className="text-wial-navy mb-10 text-3xl font-bold">{data.heading}</h2>
        )}
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.members.map((member, i) => (
            <div key={i} className="text-center">
              {member.photo_url ? (
                <Image
                  src={member.photo_url}
                  alt={`${member.name}'s photo`}
                  width={96}
                  height={96}
                  className="mx-auto size-24 rounded-full object-cover"
                />
              ) : (
                <span className="bg-wial-navy mx-auto flex size-24 items-center justify-center rounded-full text-2xl font-bold text-white">
                  {member.name[0]}
                </span>
              )}
              <h3 className="text-wial-navy mt-3 text-sm font-semibold">{member.name}</h3>
              {member.title && <p className="text-xs text-gray-500">{member.title}</p>}
              {member.bio && (
                <p className="mt-2 text-xs leading-relaxed text-gray-600">{member.bio}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
