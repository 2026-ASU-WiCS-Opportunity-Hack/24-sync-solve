import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ChapterRequestForm } from '@/components/chapters/ChapterRequestForm'

export const metadata: Metadata = {
  title: 'Request a New Chapter',
  description: 'Submit a request to establish a new WIAL regional chapter.',
}

export default async function ChapterRequestPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/chapters/request')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_suspended')
    .eq('id', user.id)
    .single()

  if (profile?.is_suspended) {
    redirect('/suspended')
  }

  const canRequest = profile?.role === 'chapter_lead' || profile?.role === 'super_admin'

  return (
    <>
      {/* Hero */}
      <section className="bg-wial-navy py-12 text-white">
        <div className="mx-auto max-w-2xl px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Building2 size={28} aria-hidden="true" />
            <h1 className="text-3xl font-extrabold">Request a New Chapter</h1>
          </div>
          <p className="mt-3 text-white/70">
            Propose a new WIAL regional chapter. A super admin will review your request.
          </p>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-6 lg:px-8">
          {!canRequest ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
              <Building2 size={36} className="mx-auto mb-3 text-amber-500" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Permission Required</h2>
              <p className="mt-2 text-sm text-gray-600">
                Only Chapter Admins and Super Admins can request new chapters. If you believe you
                should have this access, contact your regional administrator.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold text-gray-900">Chapter Request Form</h2>
              <ChapterRequestForm />
            </div>
          )}

          {canRequest && (
            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
              <h3 className="text-sm font-semibold text-blue-800">What happens next?</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-blue-700">
                <li>• A super admin will review your request within a few business days.</li>
                <li>
                  • On approval, the chapter is created and you are assigned as Chapter Admin.
                </li>
                <li>• You can then configure the chapter, manage coaches, and publish content.</li>
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
