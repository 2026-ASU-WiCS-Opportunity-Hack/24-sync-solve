import Link from 'next/link'
import Image from 'next/image'
import { z } from 'zod'

const heroSchema = z.object({
  headline: z.string().default('Welcome'),
  subheadline: z.string().optional(),
  cta_primary_text: z.string().optional(),
  cta_primary_href: z.string().optional(),
  cta_secondary_text: z.string().optional(),
  cta_secondary_href: z.string().optional(),
  background_image_url: z.string().nullable().optional(),
})

interface HeroBlockProps {
  content: Record<string, unknown>
  accentColor?: string
}

export default function HeroBlock({ content, accentColor }: HeroBlockProps) {
  const parsed = heroSchema.safeParse(content)
  const data = parsed.success ? parsed.data : heroSchema.parse({})

  const accentStyle = accentColor ? { backgroundColor: accentColor } : {}

  return (
    <section aria-label="Hero section" className="bg-wial-navy relative overflow-hidden text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.12),transparent_36%),radial-gradient(circle_at_80%_0%,rgba(204,0,0,0.22),transparent_42%)]"
      />

      {/* Background image overlay */}
      {data.background_image_url && (
        <div className="absolute inset-0">
          <Image
            src={data.background_image_url}
            alt=""
            fill
            className="object-cover opacity-20"
            priority
            sizes="100vw"
          />
        </div>
      )}

      {/* Accent stripe */}
      <div className="absolute start-0 top-0 h-full w-1.5" style={accentStyle} aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {data.headline}
          </h1>

          {data.subheadline && (
            <p className="mt-6 text-lg leading-8 text-white/80 sm:text-xl">{data.subheadline}</p>
          )}

          {(data.cta_primary_text || data.cta_secondary_text) && (
            <div className="mt-10 flex flex-wrap items-center gap-4">
              {data.cta_primary_text && data.cta_primary_href && (
                <Link
                  href={data.cta_primary_href}
                  className="focus:ring-offset-wial-navy rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:outline-none"
                  style={accentStyle}
                >
                  {data.cta_primary_text}
                </Link>
              )}
              {data.cta_secondary_text && data.cta_secondary_href && (
                <Link
                  href={data.cta_secondary_href}
                  className="rounded-lg border border-white/35 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/12 focus:ring-2 focus:ring-white focus:outline-none"
                >
                  {data.cta_secondary_text}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
