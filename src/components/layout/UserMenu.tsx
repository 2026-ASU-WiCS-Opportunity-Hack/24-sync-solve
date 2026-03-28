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
          className="rounded px-3 py-2 text-sm font-medium text-white/80 hover:text-white"
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
    user.role === 'super_admin' ? '/admin' : user.role === 'coach' ? '/coaches/profile' : '/'

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-wial-navy-light flex items-center gap-2 rounded-full p-1 text-white focus:ring-2 focus:ring-white focus:outline-none"
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
          className="absolute end-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg"
          aria-label="User menu"
        >
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-gray-900">{user.fullName ?? 'User'}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>

          <div className="py-1">
            <Link
              href={dashboardHref}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LayoutDashboard size={16} aria-hidden="true" />
              Dashboard
            </Link>

            {user.role === 'coach' && (
              <Link
                href="/coaches/profile"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User size={16} aria-hidden="true" />
                My Profile
              </Link>
            )}

            <Link
              href="/account/settings"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Settings size={16} aria-hidden="true" />
              Account Settings
            </Link>
          </div>

          <div className="border-t border-gray-100 py-1">
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
