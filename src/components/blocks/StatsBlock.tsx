import { z } from 'zod'
import { formatNumber } from '@/lib/utils/format'

const statsSchema = z.object({
  heading: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      })
    )
    .default([]),
})

interface StatsBlockProps {
  content: Record<string, unknown>
  accentColor?: string
}

export default function StatsBlock({ content, accentColor }: StatsBlockProps) {
  const parsed = statsSchema.safeParse(content)
  const data = parsed.success ? parsed.data : statsSchema.parse({})

  const accentStyle = accentColor ? { color: accentColor } : {}

  if (data.items.length === 0) return null

  return (
    <section aria-label="Statistics" className="bg-wial-navy py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {data.heading && (
          <h2 className="mb-10 text-center text-3xl font-bold text-white">{data.heading}</h2>
        )}
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {data.items.map((item, i) => (
            <div key={i} className="text-center">
              <dt className="order-2 mt-2 text-sm font-medium text-white/70">{item.label}</dt>
              <dd
                className="order-1 text-4xl font-extrabold tracking-tight sm:text-5xl"
                style={accentStyle}
              >
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
