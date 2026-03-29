import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CoachApplyForm } from '@/components/coaches/CoachApplyForm'

export const metadata: Metadata = {
  title: 'Apply to Become a Coach',
  description: 'Submit your application to join the WIAL certified coach directory.',
}

export default async function CoachApplyPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/coaches/apply')
  }

  // Check suspension
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_suspended')
    .eq('id', user.id)
    .single()

  if (profile?.is_suspended) {
    redirect('/suspended')
  }

  // Check for existing pending application
  const { data: existingApp } = await supabase
    .from('coach_applications')
    .select('id, chapter_id, created_at')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle()

  // Fetch active chapters for the form select
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name')

  return (
    <>
      {/* Hero */}
      <section className="bg-wial-navy py-12 text-white">
        <div className="mx-auto max-w-2xl px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Award size={28} aria-hidden="true" />
            <h1 className="text-3xl font-extrabold">Apply to Become a Coach</h1>
          </div>
          <p className="mt-3 text-white/70">
            Join the WIAL certified Action Learning coach directory. Submit your Credly badge to
            verify your certification.
          </p>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-6 lg:px-8">
          {existingApp ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
              <Award size={36} className="mx-auto mb-3 text-amber-500" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Application Pending</h2>
              <p className="mt-2 text-sm text-gray-600">
                You already have a pending coach application. A chapter admin will review it
                shortly. You will be notified when a decision is made.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold text-gray-900">Application Form</h2>
              <CoachApplyForm chapters={chapters ?? []} />
            </div>
          )}

          {/* Info */}
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="text-sm font-semibold text-blue-800">What happens next?</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-blue-700">
              <li>• Your Credly badge is automatically verified on submission.</li>
              <li>• A chapter admin will review your application within a few business days.</li>
              <li>
                • On approval, your coach profile will be created and you can begin editing it.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
