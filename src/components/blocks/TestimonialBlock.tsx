import Image from 'next/image'
import { z } from 'zod'

const testimonialSchema = z.object({
  heading: z.string().optional(),
  items: z
    .array(
      z.object({
        quote: z.string(),
        name: z.string(),
        title: z.string().optional(),
        organization: z.string().optional(),
        photo_url: z.string().optional(),
      })
    )
    .default([]),
})

interface TestimonialBlockProps {
  content: Record<string, unknown>
}

export default function TestimonialBlock({ content }: TestimonialBlockProps) {
  const parsed = testimonialSchema.safeParse(content)
  const data = parsed.success ? parsed.data : testimonialSchema.parse({})

  if (data.items.length === 0) return null

  return (
    <section aria-label="Testimonials" className="bg-gray-50 py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {data.heading && (
          <h2 className="text-wial-navy mb-10 text-center text-3xl font-bold">{data.heading}</h2>
        )}
        <div
          className={`grid gap-8 ${data.items.length === 1 ? 'mx-auto max-w-2xl' : 'md:grid-cols-2 lg:grid-cols-3'}`}
        >
          {data.items.map((item, i) => (
            <blockquote key={i} className="shadow-card rounded-2xl bg-white p-6">
              <p className="leading-relaxed text-gray-700 italic">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-4 flex items-center gap-3">
                {item.photo_url ? (
                  <Image
                    src={item.photo_url}
                    alt={`${item.name}'s photo`}
                    width={40}
                    height={40}
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="bg-wial-navy flex size-10 items-center justify-center rounded-full text-sm font-bold text-white">
                    {item.name[0]}
                  </span>
                )}
                <div>
                  <cite className="text-wial-navy text-sm font-semibold not-italic">
                    {item.name}
                  </cite>
                  {(item.title || item.organization) && (
                    <p className="text-xs text-gray-500">
                      {[item.title, item.organization].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
