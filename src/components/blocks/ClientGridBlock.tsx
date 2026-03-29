import Image from 'next/image'
import { z } from 'zod'
import { ExternalLink } from 'lucide-react'

const clientSchema = z.object({
  name: z.string(),
  logo_url: z.string().optional(),
  website_url: z.string().optional(),
  description: z.string().optional(),
})

const clientGridSchema = z.object({
  heading: z.string().optional(),
  clients: z.array(clientSchema).default([]),
})

interface ClientGridBlockProps {
  content: Record<string, unknown>
}

export default function ClientGridBlock({ content }: ClientGridBlockProps) {
  const parsed = clientGridSchema.safeParse(content)
  const data = parsed.success ? parsed.data : clientGridSchema.parse({})

  if (data.clients.length === 0) return null

  return (
    <section aria-label={data.heading ?? 'Our Clients'} className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {data.heading && (
          <h2 className="text-wial-navy mb-10 text-center text-3xl font-bold">{data.heading}</h2>
        )}
        <ul
          className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          role="list"
          aria-label="Client list"
        >
          {data.clients.map((client, i) => {
            const inner = (
              <>
                {client.logo_url ? (
                  <Image
                    src={client.logo_url}
                    alt={`${client.name} logo`}
                    width={120}
                    height={60}
                    className="mx-auto h-12 w-auto max-w-[120px] object-contain"
                  />
                ) : (
                  <span className="text-wial-navy mx-auto flex h-12 items-center justify-center text-sm font-semibold">
                    {client.name}
                  </span>
                )}
                <p className="mt-2 text-center text-xs font-medium text-gray-600">{client.name}</p>
                {client.description && (
                  <p className="mt-1 text-center text-xs text-gray-400">{client.description}</p>
                )}
                {client.website_url && (
                  <span className="mt-1 flex items-center justify-center gap-1 text-xs text-blue-500">
                    <ExternalLink size={10} aria-hidden="true" />
                    Visit
                  </span>
                )}
              </>
            )

            return (
              <li key={i} className="flex flex-col items-center">
                {client.website_url ? (
                  <a
                    href={client.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${client.name} website (opens in new tab)`}
                    className="w-full rounded-lg p-3 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="w-full rounded-lg p-3">{inner}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
