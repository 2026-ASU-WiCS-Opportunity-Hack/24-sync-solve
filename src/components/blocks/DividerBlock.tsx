import { z } from 'zod'

const dividerSchema = z.object({
  style: z.enum(['line', 'dots', 'wave', 'space']).optional().default('line'),
  spacing: z.enum(['sm', 'md', 'lg']).optional().default('md'),
})

interface DividerBlockProps {
  content: Record<string, unknown>
}

export default function DividerBlock({ content }: DividerBlockProps) {
  const parsed = dividerSchema.safeParse(content)
  const data = parsed.success ? parsed.data : dividerSchema.parse({})

  const spacingClass = { sm: 'py-4', md: 'py-8', lg: 'py-12' }[data.spacing ?? 'md']

  if (data.style === 'space') {
    return <div className={spacingClass} aria-hidden="true" />
  }

  return (
    <div className={`${spacingClass} flex justify-center`} role="separator" aria-hidden="true">
      {data.style === 'dots' ? (
        <span className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 rounded-full bg-gray-300" />
          ))}
        </span>
      ) : (
        <hr className="w-24 border-gray-300" />
      )}
    </div>
  )
}
