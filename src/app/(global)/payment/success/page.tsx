import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Payment Successful' }

export default async function PaymentSuccessPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-gray-50 py-16">
      <div className="mx-auto max-w-md px-6 text-center">
        <CheckCircle size={56} className="mx-auto mb-4 text-green-500" aria-hidden="true" />
        <h1 className="text-wial-navy mb-2 text-2xl font-extrabold">Payment successful!</h1>
        <p className="mb-4 text-gray-600">
          Your payment has been processed. A receipt has been sent to your email.
        </p>
        <p className="mb-8 text-sm text-gray-500">
          Your certification or membership status will be updated shortly.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {user && (
            <Link
              href="/dashboard"
              className="bg-wial-navy hover:bg-wial-navy-light rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              Go to Dashboard
            </Link>
          )}
          <Link
            href="/coaches"
            className="rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Coach Directory
          </Link>
        </div>
      </div>
    </section>
  )
}
