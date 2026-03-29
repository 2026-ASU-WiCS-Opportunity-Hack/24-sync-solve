import type { Metadata } from 'next'
import Link from 'next/link'
import { XCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Payment Cancelled' }

export default function PaymentCancelledPage() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-gray-50 py-16">
      <div className="mx-auto max-w-md px-6 text-center">
        <XCircle size={56} className="mx-auto mb-4 text-amber-400" aria-hidden="true" />
        <h1 className="text-wial-navy mb-2 text-2xl font-extrabold">Payment cancelled</h1>
        <p className="mb-4 text-gray-600">
          No charge was made. You can retry your payment at any time.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="bg-wial-navy hover:bg-wial-navy-light rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </section>
  )
}
