import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { UserMenu } from '@/components/layout/UserMenu'
import { getAdminDashboardStats } from '@/features/chapters/queries/getChapterAdmin'
import type { AuthUser } from '@/types'

export const metadata: Metadata = {
  title: {
    template: '%s | WIAL Admin',
    default: 'Admin Panel',
  },
  robots: { index: false, follow: false },
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient()

  // ── Auth guard: must be authenticated ─────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/admin')
  }

  // ── Role guard: must be super_admin ───────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url, is_suspended')
    .eq('id', user.id)
    .single()

  if (profile?.is_suspended) {
    redirect('/suspended')
  }

  if (profile?.role !== 'super_admin') {
    redirect('/unauthorized')
  }

  // Fetch pending approvals count for sidebar badge
  const stats = await getAdminDashboardStats(supabase)

  const adminUser: AuthUser = {
    id: user.id,
    email: user.email ?? '',
    role: 'super_admin',
    chapterId: null,
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    isSuspended: false,
    membershipStatus: 'none',
    chapterRoles: {},
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        pendingApprovals={stats.pendingApprovals}
        pendingApplications={stats.pendingApplications}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Admin top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div />
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              Super Admin
            </span>
            <UserMenu user={adminUser} />
          </div>
        </header>

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto bg-gray-50 p-6 focus:outline-none"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
