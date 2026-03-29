import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: {
    template: '%s | WIAL',
    default: 'WIAL',
  },
}

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="from-wial-navy to-wial-navy-dark flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <div className="w-full max-w-md">
        {/* WIAL Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold tracking-tight text-white">WIAL</span>
            <span className="text-wial-red mt-1 block text-xs font-semibold tracking-widest uppercase">
              World Institute for Action Learning
            </span>
          </Link>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl">{children}</div>
      </div>
    </div>
  )
}
