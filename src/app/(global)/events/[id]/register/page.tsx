import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEventById } from '@/features/events/queries/getEvents'
import { EventRegistrationForm } from '@/components/events/EventRegistrationForm'
import { formatDate } from '@/lib/utils/format'
import { formatCurrency } from '@/lib/utils/format'

interface EventRegisterPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EventRegisterPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const event = await getEventById(supabase, id)
  if (!event) return { title: 'Event Not Found' }
  return { title: `Register — ${event.title}` }
}

export default async function EventRegisterPage({ params }: EventRegisterPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const event = await getEventById(supabase, id)

  if (!event || !event.is_published) notFound()

  const ticketPrice = (event as typeof event & { ticket_price?: number | null }).ticket_price
  const isFree = !ticketPrice || ticketPrice <= 0
  const currency = 'USD'

  return (
    <>
      <section className="bg-wial-navy py-10 text-white">
        <div className="mx-auto max-w-2xl px-6">
          <Link
            href={`/events/${id}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
          >
            ← Back to event
          </Link>
          <h1 className="text-2xl font-extrabold">{event.title}</h1>
          <p className="mt-1 text-sm text-white/70">
            {formatDate(event.start_date)} ·{' '}
            {event.is_virtual ? 'Online' : (event.location_name ?? 'Location TBA')}
          </p>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-wial-navy text-xl font-semibold">
                {isFree ? 'Register for this event' : 'Purchase your ticket'}
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  isFree ? 'bg-green-100 text-green-800' : 'bg-wial-navy/10 text-wial-navy'
                }`}
              >
                {isFree ? 'Free' : formatCurrency(ticketPrice!, currency)}
              </span>
            </div>

            <EventRegistrationForm eventId={id} isFree={isFree} />
          </div>
        </div>
      </section>
    </>
  )
}
