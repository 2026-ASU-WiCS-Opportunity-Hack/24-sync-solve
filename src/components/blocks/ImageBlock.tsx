import Image from 'next/image'
import { z } from 'zod'

const imageSchema = z.object({
  src: z.string().url(),
  alt: z.string().default(''),
  caption: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
})

interface ImageBlockProps {
  content: Record<string, unknown>
}

export default function ImageBlock({ content }: ImageBlockProps) {
  const parsed = imageSchema.safeParse(content)
  if (!parsed.success) return null
  const data = parsed.data

  return (
    <section aria-label="Image" className="bg-white py-12">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <figure>
          <div className="relative overflow-hidden rounded-xl">
            <Image
              src={data.src}
              alt={data.alt}
              width={data.width ?? 1200}
              height={data.height ?? 675}
              className="w-full object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>
          {data.caption && (
            <figcaption className="mt-3 text-center text-sm text-gray-500">
              {data.caption}
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  )
}
