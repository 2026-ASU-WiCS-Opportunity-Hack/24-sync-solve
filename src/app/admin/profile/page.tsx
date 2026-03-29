import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserProfileForm } from '@/components/layout/UserProfileForm'

export const metadata: Metadata = { title: 'My Profile' }

export const revalidate = 0

export default async function AdminProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin/profile')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url, is_suspended')
    .eq('id', user.id)
    .single()

  if (profile?.is_suspended) redirect('/suspended')
  if (profile?.role !== 'super_admin') redirect('/unauthorized')

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Update your name and profile photo.</p>
      </div>

      <div className="max-w-2xl">
        <UserProfileForm
          fullName={profile?.full_name ?? null}
          email={user.email ?? ''}
          avatarUrl={profile?.avatar_url ?? null}
        />
      </div>
    </>
  )
}
