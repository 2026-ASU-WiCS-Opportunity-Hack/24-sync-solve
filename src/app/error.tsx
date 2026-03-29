'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global error boundary page.
 * Must be a Client Component (Next.js requirement for error.tsx).
 * Shown when an uncaught error occurs in a route segment.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to monitoring in production (e.g., Sentry)
    console.error('[Error boundary]', error)
  }, [error])

  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-20 text-center">
      <AlertTriangle size={52} className="mx-auto mb-4 text-amber-400" aria-hidden="true" />
      <h1 className="text-wial-navy text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-gray-500">
        An unexpected error occurred. Please try again or return to the home page.
      </p>
      {error.digest && <p className="mt-2 text-xs text-gray-400">Error ID: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="bg-wial-navy hover:bg-wial-navy-dark rounded-xl px-6 py-3 text-sm font-semibold text-white transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Back to Home
        </Link>
      </div>
    </section>
  )
}
