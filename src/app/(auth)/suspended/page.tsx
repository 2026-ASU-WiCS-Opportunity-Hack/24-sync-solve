import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export const metadata: Metadata = { title: 'Account Suspended' }

export default function SuspendedPage() {
  return (
    <div className="space-y-5 text-center">
      <div className="flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-red-100">
          <ShieldAlert size={32} className="text-red-600" aria-hidden="true" />
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Account Suspended</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your account has been suspended and you cannot access the platform at this time.
        </p>
      </div>

      <p className="text-sm text-gray-500">
        If you believe this is a mistake, please contact{' '}
        <a href="mailto:support@wial.org" className="font-medium text-blue-600 hover:underline">
          support@wial.org
        </a>{' '}
        for assistance.
      </p>

      <div className="border-t border-gray-200 pt-4">
        <Link
          href="/"
          className="text-sm font-medium text-gray-500 hover:text-gray-700 hover:underline"
        >
          ← Return to homepage
        </Link>
      </div>
    </div>
  )
}
