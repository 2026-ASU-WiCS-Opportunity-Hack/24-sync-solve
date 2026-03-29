interface RgbColor {
  r: number
  g: number
  b: number
}

const HEX_3 = /^#([0-9a-f]{3})$/i
const HEX_6 = /^#([0-9a-f]{6})$/i

function normalizeHex(color: string): string | null {
  const trimmed = color.trim()

  const shortMatch = trimmed.match(HEX_3)
  if (shortMatch?.[1]) {
    const [r, g, b] = shortMatch[1].split('')
    return `#${r}${r}${g}${g}${b}${b}`
  }

  const longMatch = trimmed.match(HEX_6)
  if (longMatch?.[1]) {
    return `#${longMatch[1]}`.toLowerCase()
  }

  return null
}

function hexToRgb(color: string): RgbColor | null {
  const normalized = normalizeHex(color)
  if (!normalized) return null

  const r = Number.parseInt(normalized.slice(1, 3), 16)
  const g = Number.parseInt(normalized.slice(3, 5), 16)
  const b = Number.parseInt(normalized.slice(5, 7), 16)

  return { r, g, b }
}

function linearize(channel: number): number {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(rgb: RgbColor): number {
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b)
}

/**
 * Returns a highly readable text color for an arbitrary hex background.
 */
export function getContrastTextColor(background: string): '#ffffff' | '#0b1f3a' {
  const rgb = hexToRgb(background)
  if (!rgb) return '#ffffff'

  const luminance = relativeLuminance(rgb)
  return luminance > 0.42 ? '#0b1f3a' : '#ffffff'
}

/**
 * Returns an rgba() color with alpha for a hex color.
 */
export function withAlpha(color: string, alpha: number): string {
  const rgb = hexToRgb(color)
  if (!rgb) return `rgba(255,255,255,${alpha})`

  const safeAlpha = Math.max(0, Math.min(1, alpha))
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${safeAlpha})`
}
