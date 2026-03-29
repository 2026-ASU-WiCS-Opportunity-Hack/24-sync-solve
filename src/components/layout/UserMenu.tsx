'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User, LogOut, Settings, LayoutDashboard } from 'lucide-react'
import { logoutAction } from '@/features/auth/actions/login'
import type { AuthUser } from '@/types'

interface UserMenuProps {
  user: AuthUser | null
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-full px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          Log In
        </Link>
        <Link
          href="/register"
          className="bg-wial-red hover:bg-wial-red-dark rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          Get Started
        </Link>
      </div>
    )
  }

  const dashboardHref =
    user.role === 'super_admin' ? '/admin' : user.role === 'public' ? '/' : '/dashboard'

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-wial-navy-light flex items-center gap-2 rounded-full border border-white/15 p-1 text-white focus:ring-2 focus:ring-white focus:outline-none"
        aria-label="Open user menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={`${user.fullName ?? user.email}'s avatar`}
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <span className="bg-wial-red flex size-8 items-center justify-center rounded-full text-sm font-bold text-white">
            {(user.fullName ?? user.email)[0]?.toUpperCase()}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          aria-label="User menu"
        >
          <div className="from-wial-navy to-wial-navy-light border-b border-gray-100 bg-gradient-to-r px-4 py-3 text-white">
            <p className="truncate text-sm font-semibold text-white">{user.fullName ?? 'User'}</p>
            <p className="truncate text-xs text-white/70">{user.email}</p>
          </div>

          <div className="py-1.5">
            <Link
              href={dashboardHref}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <LayoutDashboard size={16} aria-hidden="true" />
              Dashboard
            </Link>

            {user.role === 'coach' && (
              <Link
                href="/coaches/profile"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <User size={16} aria-hidden="true" />
                My Profile
              </Link>
            )}

            <Link
              href="/account/settings"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Settings size={16} aria-hidden="true" />
              Account Settings
            </Link>
          </div>

          <div className="border-t border-gray-100 py-1.5">
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-700 transition-colors hover:bg-red-50"
              >
                <LogOut size={16} aria-hidden="true" />
                Log Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
