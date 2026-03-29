import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Mail, ShieldCheck, UserCircle2, KeyRound, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Account Settings',
  description: 'Manage your account details and security settings.',
}

export const revalidate = 0

export default async function AccountSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/account/settings')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, email')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name ?? 'WIAL User'
  const displayEmail = profile?.email ?? user.email ?? 'No email available'

  return (
    <>
      <section className="bg-wial-navy relative overflow-hidden py-14 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(255,255,255,0.14),transparent_36%),radial-gradient(circle_at_85%_0%,rgba(204,0,0,0.22),transparent_42%)]"
        />
        <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
          <h1 className="text-4xl leading-tight font-extrabold sm:text-5xl">Account Settings</h1>
          <p className="mt-3 text-white/80">Review your account information and security status.</p>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-4xl space-y-6 px-6 lg:px-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-wial-navy mb-4 text-lg font-semibold">Profile</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Name</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{displayName}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Role</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {profile?.role ?? 'public'}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:col-span-2">
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Email</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{displayEmail}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-wial-navy mb-4 text-lg font-semibold">Security</h2>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <ShieldCheck size={18} className="text-green-600" aria-hidden="true" />
                <p className="text-sm text-gray-700">Session is active and authenticated.</p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <KeyRound size={18} className="text-wial-navy" aria-hidden="true" />
                <p className="text-sm text-gray-700">
                  Password updates can be done via reset flow if needed.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to Dashboard
            </Link>
            <Link
              href="/coaches/profile"
              className="bg-wial-navy hover:bg-wial-navy-dark inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              <UserCircle2 size={15} aria-hidden="true" />
              Manage Coach Profile
            </Link>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Mail size={15} aria-hidden="true" />
              Reset Password
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
