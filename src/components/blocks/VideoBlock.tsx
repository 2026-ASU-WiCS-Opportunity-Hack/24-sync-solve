import { z } from 'zod'

const videoSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
  aspect: z.enum(['16:9', '4:3', '1:1']).optional().default('16:9'),
})

interface VideoBlockProps {
  content: Record<string, unknown>
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (ytMatch?.[1]) return `https://www.youtube.com/embed/${ytMatch[1]}`

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch?.[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  return null
}

export default function VideoBlock({ content }: VideoBlockProps) {
  const parsed = videoSchema.safeParse(content)
  if (!parsed.success) return null

  const data = parsed.data
  const embedUrl = getEmbedUrl(data.url)
  if (!embedUrl) return null

  const aspectClass = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
  }[data.aspect ?? '16:9']

  return (
    <section aria-label={data.caption ?? 'Video'} className="bg-white py-12">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <figure>
          <div className={`relative overflow-hidden rounded-xl ${aspectClass}`}>
            <iframe
              src={embedUrl}
              title={data.caption ?? 'Embedded video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
              loading="lazy"
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
