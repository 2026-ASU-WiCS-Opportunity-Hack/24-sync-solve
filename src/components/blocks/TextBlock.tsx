import { z } from 'zod'
import { RichTextRenderer } from '@/components/common/RichTextRenderer'

const textSchema = z.object({
  heading: z.string().optional(),
  body: z.record(z.string(), z.unknown()).optional(),
})

interface TextBlockProps {
  content: Record<string, unknown>
}

export default function TextBlock({ content }: TextBlockProps) {
  const parsed = textSchema.safeParse(content)
  const data = parsed.success ? parsed.data : {}

  return (
    <section aria-label={data.heading ?? 'Content section'} className="bg-white py-16">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {data.heading && (
          <h2 className="text-wial-navy text-3xl font-bold tracking-tight sm:text-4xl">
            {data.heading}
          </h2>
        )}
        {data.body && (
          <div className={`prose-content text-gray-600 ${data.heading ? 'mt-6' : ''}`}>
            <RichTextRenderer content={data.body as Record<string, unknown>} />
          </div>
        )}
      </div>
    </section>
  )
}
