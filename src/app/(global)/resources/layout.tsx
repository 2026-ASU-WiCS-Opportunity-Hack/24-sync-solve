'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookMarked, LibraryBig, Video } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const tabs = [
    { name: 'Overview', href: '/resources', icon: BookMarked },
    { name: 'AI Research Library', href: '/resources/research-library', icon: LibraryBig },
    { name: 'Webinars Hub', href: '/resources/webinars', icon: Video },
  ]

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Dynamic Sub-Navigation Header */}
      <div className="bg-wial-navy border-wial-navy-light sticky top-[64px] z-40 hidden border-b shadow-md md:block">
        <div className="mx-auto max-w-7xl px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-wial-red text-white'
                      : 'border-transparent text-white/70 hover:border-white/30 hover:text-white'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <tab.icon
                    className={cn('h-4 w-4', isActive ? 'text-wial-red' : 'text-white/50')}
                  />
                  {tab.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Page Content */}
      <main>{children}</main>
    </div>
  )
}
