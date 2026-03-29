'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  Settings,
  ExternalLink,
  FileText,
  Calendar,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

interface ChapterManageSidebarProps {
  chapterSlug: string
  chapterName: string
  pendingApplications?: number
  pendingApprovals?: number
}

export function ChapterManageSidebar({
  chapterSlug,
  chapterName,
  pendingApplications = 0,
  pendingApprovals = 0,
}: ChapterManageSidebarProps) {
  const pathname = usePathname()
  const base = `/${chapterSlug}/manage`

  const navItems: NavItem[] = [
    { href: base, label: 'Overview', icon: LayoutDashboard },
    { href: `${base}/users`, label: 'Members', icon: Users },
    { href: `${base}/coaches`, label: 'Coaches', icon: GraduationCap },
    {
      href: `${base}/coaches/applications`,
      label: 'Applications',
      icon: FileText,
      badge: pendingApplications > 0 ? pendingApplications : undefined,
    },
    {
      href: `${base}/approvals`,
      label: 'Approvals',
      icon: ClipboardCheck,
      badge: pendingApprovals > 0 ? pendingApprovals : undefined,
    },
    { href: `/${chapterSlug}/events/manage`, label: 'Events', icon: Calendar },
    { href: `${base}/payments`, label: 'Payments', icon: CreditCard },
    { href: `${base}/settings`, label: 'Settings', icon: Settings },
  ]

  function isActive(href: string) {
    if (href === base) return pathname === base
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="bg-wial-navy flex w-64 shrink-0 flex-col"
      aria-label="Chapter admin navigation"
    >
      {/* Header */}
      <div className="border-wial-navy-dark flex h-16 items-center border-b px-6">
        <Link
          href={base}
          className="focus:ring-offset-wial-navy flex items-center gap-2 rounded focus:ring-2 focus:ring-white focus:ring-offset-2 focus:outline-none"
          aria-label={`${chapterName} chapter admin — Go to overview`}
        >
          <span className="text-sm font-extrabold text-white">WIAL</span>
          <span className="text-xs font-semibold tracking-widest text-white/50 uppercase">
            {chapterName}
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Chapter management sections">
        {navItems.map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-white/15 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon size={18} aria-hidden="true" />
            <span className="flex-1">{label}</span>
            {badge !== undefined && (
              <span
                className="bg-wial-red flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white"
                aria-label={`${badge} pending`}
              >
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-wial-navy-dark space-y-1 border-t p-3">
        <Link
          href={`/${chapterSlug}`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          target="_blank"
        >
          <ExternalLink size={16} aria-hidden="true" />
          View Chapter Site
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LayoutDashboard size={16} aria-hidden="true" />
          My Dashboard
        </Link>
      </div>
    </aside>
  )
}
