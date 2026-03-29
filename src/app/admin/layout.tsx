import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { getAdminDashboardStats } from '@/features/chapters/queries/getChapterAdmin'

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
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    // Redirect non-admins to home with an error indication
    redirect('/?error=unauthorized')
  }

  // Fetch pending approvals count for sidebar badge
  const stats = await getAdminDashboardStats(supabase)

  return (
    <div className="to-wial-surface/50 flex min-h-screen bg-gradient-to-b from-white">
      <AdminSidebar pendingApprovals={stats.pendingApprovals} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Admin top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200/80 bg-white/90 px-6 backdrop-blur">
          <div />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{profile?.full_name ?? user.email}</span>
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
              Super Admin
            </span>
          </div>
        </header>

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto bg-transparent p-6 focus:outline-none"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
