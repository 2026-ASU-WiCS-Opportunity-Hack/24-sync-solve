import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAdminDashboardStats, getCoachGrowth } from '@/features/chapters/queries/getChapterAdmin'
import { getPaymentStats } from '@/features/payments/queries/getPayments'
import { formatCurrency } from '@/lib/utils/format'
import {
  Building2,
  GraduationCap,
  Users,
  ClipboardCheck,
  CreditCard,
  Plus,
  BookUser,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'

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
      className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
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
  const [stats, paymentStats, coachGrowth] = await Promise.all([
    getAdminDashboardStats(supabase),
    getPaymentStats(supabase),
    getCoachGrowth(supabase, { months: 6 }),
  ])

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
    {
      label: 'Pending Applications',
      value: stats.pendingApplications,
      icon: BookUser,
      href: '/admin/chapter-requests',
      highlight: stats.pendingApplications > 0,
    },
    {
      label: 'Suspended Users',
      value: stats.suspendedUsers,
      icon: ShieldAlert,
      href: '/admin/users',
      highlight: stats.suspendedUsers > 0,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of the WIAL global platform.</p>
      </div>

      {/* Stats grid */}
      <section aria-label="Platform statistics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
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
      </section>

      {/* Analytics — Payments & Growth */}
      <section aria-label="Analytics">
        <h2 className="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">
          Analytics (last 30 days)
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Payment conversion rate */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
              <TrendingUp size={13} aria-hidden="true" />
              Payment Conversion
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{paymentStats.conversionRate}%</p>
            <p className="mt-1 text-xs text-gray-600">
              {paymentStats.succeededLast30} of {paymentStats.totalLast30} payments succeeded
            </p>
          </div>

          {/* Revenue last 30 days */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
              <CreditCard size={13} aria-hidden="true" />
              Revenue
            </div>
            <p className="text-3xl font-extrabold text-gray-900">
              {formatCurrency(paymentStats.revenueLast30, 'USD')}
            </p>
            <p className="mt-1 text-xs text-gray-600">Successful payments, last 30 days</p>
          </div>

          {/* New coaches this month */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
              <GraduationCap size={13} aria-hidden="true" />
              New Coaches
            </div>
            <p className="text-3xl font-extrabold text-gray-900">
              {coachGrowth[coachGrowth.length - 1]?.count ?? 0}
            </p>
            <p className="mt-1 text-xs text-gray-600">Added this month</p>
          </div>
        </div>

        {/* Coach growth bar chart (CSS-only) */}
        {coachGrowth.length > 0 && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Coach Growth — Last 6 Months
            </p>
            <div className="flex items-end gap-2" aria-label="Coach growth chart" role="img">
              {(() => {
                const max = Math.max(...coachGrowth.map((m) => m.count), 1)
                return coachGrowth.map((m) => (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-gray-700">{m.count}</span>
                    <div
                      className="bg-wial-navy w-full rounded-t"
                      style={{ height: `${Math.max((m.count / max) * 80, 4)}px` }}
                      aria-hidden="true"
                    />
                    <span className="text-[10px] text-gray-600">{m.month.slice(5)}</span>
                  </div>
                ))
              })()}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
