import Link from 'next/link'
import { z } from 'zod'

const ctaSchema = z.object({
  heading: z.string().default('Ready to get started?'),
  subheading: z.string().optional(),
  button_text: z.string().default('Learn More'),
  button_href: z.string().default('/'),
  variant: z.enum(['dark', 'light', 'accent']).default('dark'),
})

interface CtaBlockProps {
  content: Record<string, unknown>
  accentColor?: string
}

export default function CtaBlock({ content, accentColor }: CtaBlockProps) {
  const parsed = ctaSchema.safeParse(content)
  const data = parsed.success ? parsed.data : ctaSchema.parse({})

  const isLight = data.variant === 'light'
  const bgClass = isLight ? 'bg-gray-50' : 'bg-wial-navy'
  const textClass = isLight ? 'text-wial-navy' : 'text-white'
  const subTextClass = isLight ? 'text-gray-600' : 'text-white/70'
  const btnStyle = accentColor
    ? { backgroundColor: accentColor, borderColor: accentColor }
    : undefined
  const btnClass = `rounded-lg px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isLight ? 'bg-wial-red focus:ring-wial-red' : 'focus:ring-white'}`

  return (
    <section aria-label="Call to action" className={`${bgClass} py-16`}>
      <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
        <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl ${textClass}`}>
          {data.heading}
        </h2>
        {data.subheading && <p className={`mt-4 text-lg ${subTextClass}`}>{data.subheading}</p>}
        <div className="mt-8">
          <Link href={data.button_href} className={btnClass} style={btnStyle}>
            {data.button_text}
          </Link>
        </div>
      </div>
    </section>
  )
}
