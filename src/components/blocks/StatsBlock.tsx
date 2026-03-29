import { z } from 'zod'

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

const STATS_BG = '#003366'

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace('#', '')
  if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(normalized)) {
    return null
  }

  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => `${c}${c}`)
          .join('')
      : normalized

  const value = Number.parseInt(full, 16)
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (channel: number) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function contrastRatio(hexA: string, hexB: string): number | null {
  const rgbA = hexToRgb(hexA)
  const rgbB = hexToRgb(hexB)
  if (!rgbA || !rgbB) {
    return null
  }

  const lumA = relativeLuminance(rgbA.r, rgbA.g, rgbA.b)
  const lumB = relativeLuminance(rgbB.r, rgbB.g, rgbB.b)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)

  return (lighter + 0.05) / (darker + 0.05)
}

function getReadableValueColor(accentColor?: string): string {
  if (!accentColor) return '#ffffff'

  const ratio = contrastRatio(accentColor, STATS_BG)
  if (ratio == null || ratio < 4.5) {
    return '#ffffff'
  }

  return accentColor
}

export default function StatsBlock({ content, accentColor }: StatsBlockProps) {
  const parsed = statsSchema.safeParse(content)
  const data = parsed.success ? parsed.data : statsSchema.parse({})

  const accentStyle = { color: getReadableValueColor(accentColor) }

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
                className="order-1 text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
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
