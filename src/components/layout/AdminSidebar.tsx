'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  ClipboardCheck,
  CreditCard,
  ExternalLink,
  BookOpen,
  BookUser,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

interface AdminSidebarProps {
  pendingApprovals?: number
  pendingApplications?: number
}

export function AdminSidebar({ pendingApprovals = 0, pendingApplications = 0 }: AdminSidebarProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/chapters', label: 'Chapters', icon: Building2 },
    { href: '/admin/coaches', label: 'Coaches', icon: GraduationCap },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/knowledge/upload', label: 'Knowledge Hub', icon: BookOpen },
    {
      href: '/admin/approvals',
      label: 'Approvals',
      icon: ClipboardCheck,
      badge: pendingApprovals > 0 ? pendingApprovals : undefined,
    },
    {
      href: '/admin/chapter-requests',
      label: 'Applications',
      icon: BookUser,
      badge: pendingApplications > 0 ? pendingApplications : undefined,
    },
    { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  ]

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="bg-wial-navy flex w-64 shrink-0 flex-col" aria-label="Admin navigation">
      {/* Logo */}
      <div className="border-wial-navy-dark flex h-16 items-center border-b px-6">
        <Link
          href="/"
          className="focus:ring-offset-wial-navy flex items-center gap-2 rounded focus:ring-2 focus:ring-white focus:ring-offset-2 focus:outline-none"
          aria-label="WIAL — Go to home page"
        >
          <span className="text-lg font-extrabold text-white">WIAL</span>
          <span className="text-xs font-semibold tracking-widest text-white/50 uppercase">
            Admin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Admin sections">
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

      {/* Footer: back to site */}
      <div className="border-wial-navy-dark border-t p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ExternalLink size={16} aria-hidden="true" />
          Back to Site
        </Link>
      </div>
    </aside>
  )
}
