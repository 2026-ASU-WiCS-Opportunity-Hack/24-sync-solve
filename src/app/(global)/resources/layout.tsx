'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookMarked, LibraryBig, Video } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Main Page Content */}
      <main>{children}</main>
    </div>
  )
}
