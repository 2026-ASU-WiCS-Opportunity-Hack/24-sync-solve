import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldX } from 'lucide-react'

export const metadata: Metadata = { title: 'Access Denied' }

export default function UnauthorizedPage() {
  return (
    <div className="space-y-5 text-center">
      <div className="flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-amber-100">
          <ShieldX size={32} className="text-amber-600" aria-hidden="true" />
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-2 text-sm text-gray-600">
          You don&apos;t have permission to view this page.
        </p>
      </div>

      <p className="text-sm text-gray-500">
        If you believe this is a mistake, please contact your administrator or{' '}
        <a href="mailto:support@wial.org" className="font-medium text-blue-600 hover:underline">
          support@wial.org
        </a>
        .
      </p>

      <div className="flex justify-center gap-4 border-t border-gray-200 pt-4">
        <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-gray-500 hover:text-gray-700 hover:underline"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  )
}
