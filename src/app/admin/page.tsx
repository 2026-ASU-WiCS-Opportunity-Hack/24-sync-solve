import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAdminDashboardStats } from '@/features/chapters/queries/getChapterAdmin'
import { Building2, GraduationCap, Users, ClipboardCheck, CreditCard, Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

export const revalidate = 60

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  href: string
  highlight?: boolean
}

function StatCard({ label, value, icon: Icon, href, highlight }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div
        aria-hidden="true"
        className="from-wial-navy/8 pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r to-transparent"
      />
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
          highlight ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
        }`}
      >
        <Icon size={22} aria-hidden="true" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </Link>
  )
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const stats = await getAdminDashboardStats(supabase)

  const statCards = [
    {
      label: 'Active Chapters',
      value: stats.chapterCount,
      icon: Building2,
      href: '/admin/chapters',
    },
    {
      label: 'Coach Profiles',
      value: stats.coachCount,
      icon: GraduationCap,
      href: '/admin/coaches',
    },
    {
      label: 'Registered Users',
      value: stats.userCount,
      icon: Users,
      href: '/admin/users',
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: ClipboardCheck,
      href: '/admin/approvals',
      highlight: stats.pendingApprovals > 0,
    },
    {
      label: 'Successful Payments',
      value: stats.totalPayments,
      icon: CreditCard,
      href: '/admin/payments',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of the WIAL global platform.</p>
      </div>

      {/* Stats grid */}
      <section aria-label="Platform statistics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      {/* Pending approvals alert */}
      {stats.pendingApprovals > 0 && (
        <section aria-label="Action required">
          <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <ClipboardCheck size={20} className="shrink-0 text-amber-600" aria-hidden="true" />
              <p className="text-sm font-medium text-amber-800">
                {stats.pendingApprovals} content block
                {stats.pendingApprovals !== 1 ? 's' : ''} pending your approval.
              </p>
            </div>
            <Link
              href="/admin/approvals"
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Review now
            </Link>
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section aria-label="Quick actions">
        <h2 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
          Quick Actions
        </h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/chapters/new"
              className="bg-wial-navy hover:bg-wial-navy-dark flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              <Plus size={16} aria-hidden="true" />
              New Chapter
            </Link>
            <Link
              href="/admin/approvals"
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ClipboardCheck size={16} aria-hidden="true" />
              Review Approvals
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
