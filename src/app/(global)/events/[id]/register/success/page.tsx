import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getEventById } from '@/features/events/queries/getEvents'

export const metadata: Metadata = { title: 'Registration Confirmed' }

interface SuccessPageProps {
  params: Promise<{ id: string }>
}

export default async function EventRegisterSuccessPage({ params }: SuccessPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const event = await getEventById(supabase, id)

  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-gray-50 py-16">
      <div className="mx-auto max-w-md px-6 text-center">
        <CheckCircle size={56} className="mx-auto mb-4 text-green-500" aria-hidden="true" />
        <h1 className="text-wial-navy mb-2 text-2xl font-extrabold">You&apos;re registered!</h1>
        {event && (
          <p className="mb-4 text-gray-600">
            Your registration for <strong>{event.title}</strong> is confirmed.
          </p>
        )}
        <p className="mb-8 text-sm text-gray-500">
          Check your email for a confirmation. We look forward to seeing you there.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {event && (
            <Link
              href={`/events/${id}`}
              className="bg-wial-navy hover:bg-wial-navy-light rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              View Event Details
            </Link>
          )}
          <Link
            href="/events"
            className="rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Browse All Events
          </Link>
        </div>
      </div>
    </section>
  )
}
