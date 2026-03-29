import type { Metadata } from 'next'

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
    <div className="from-wial-navy via-wial-navy to-wial-navy-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -start-12 top-8 h-56 w-56 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="bg-wial-red/25 pointer-events-none absolute -end-12 bottom-10 h-48 w-48 rounded-full blur-3xl"
      />
      <div className="w-full max-w-md">
        {/* WIAL Logo */}
        <div className="mb-8 text-center">
          <a href="/" className="inline-block">
            <span className="text-3xl font-bold tracking-tight text-white">WIAL</span>
            <span className="text-wial-red mt-1 block text-xs font-semibold tracking-widest uppercase">
              World Institute for Action Learning
            </span>
          </a>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border border-white/20 bg-white p-8 shadow-2xl">{children}</div>
      </div>
    </div>
  )
}
