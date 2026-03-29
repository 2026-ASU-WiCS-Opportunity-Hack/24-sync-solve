'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User, LogOut, LayoutDashboard, Award } from 'lucide-react'
import { Button } from '@heroui/react'
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
          className="bg-wial-red hover:bg-wial-red-dark rounded-lg px-4 py-2 text-sm font-semibold text-white"
        >
          Get Started
        </Link>
      </div>
    )
  }

  const dashboardHref = user.role === 'super_admin' ? '/admin' : '/dashboard'

  return (
    <div className="relative" ref={menuRef}>
      <Button
        type="button"
        isIconOnly
        onPress={() => setIsOpen(!isOpen)}
        className="hover:bg-wial-navy-light flex items-center gap-2 rounded-full p-1 text-white"
        aria-label="Open user menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
        variant="ghost"
      >
        {user.avatarUrl ? (
          <div className="relative size-8 overflow-hidden rounded-full">
            <Image
              src={user.avatarUrl}
              alt={`${user.fullName ?? user.email}'s avatar`}
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
        ) : (
          <span className="bg-wial-red flex size-8 items-center justify-center rounded-full text-sm font-bold text-white">
            {(user.fullName ?? user.email)[0]?.toUpperCase()}
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          role="menu"
          className="absolute inset-e-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg"
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

            {user.role === 'super_admin' && (
              <Link
                href="/admin/profile"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User size={16} aria-hidden="true" />
                My Profile
              </Link>
            )}

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

            {user.role === 'user' && (
              <Link
                href="/coaches/apply"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Award size={16} aria-hidden="true" />
                Apply to be a Coach
              </Link>
            )}
          </div>

          <div className="border-t border-gray-100 py-1">
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                fullWidth
                className="justify-start rounded-none px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <LogOut size={16} aria-hidden="true" />
                Log Out
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
