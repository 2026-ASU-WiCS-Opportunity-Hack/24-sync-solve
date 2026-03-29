'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@heroui/react'
import { GLOBAL_NAV_LINKS, CHAPTER_NAV_LINKS } from '@/lib/utils/constants'
import { logoutAction } from '@/features/auth/actions/login'
import type { AuthUser } from '@/types'

interface MobileNavProps {
  chapterSlug?: string
  chapterName?: string
  user: AuthUser | null
}

export function MobileNav({ chapterSlug, user }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleClose = () => setIsOpen(false)

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        isIconOnly
        onPress={() => setIsOpen(!isOpen)}
        variant="ghost"
        className="hover:bg-wial-navy-light rounded p-2 text-white"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div
          id="mobile-menu"
          className="border-wial-navy-dark bg-wial-navy absolute inset-x-0 top-full z-50 border-t shadow-xl"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="space-y-1 px-4 pt-2 pb-4">
            {(chapterSlug ? CHAPTER_NAV_LINKS : GLOBAL_NAV_LINKS).map((link) => (
              <Link
                key={link.href}
                href={chapterSlug ? `/${chapterSlug}${link.href}` : link.href}
                onClick={handleClose}
                className="hover:bg-wial-navy-light block rounded px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white"
              >
                {link.labelKey.replace('nav.', '')}
              </Link>
            ))}

            <div className="my-2 border-t border-white/10" />

            {user ? (
              <>
                <div className="px-3 py-2 text-xs text-white/50">{user.email}</div>
                {(user.role === 'super_admin' || user.role === 'chapter_lead') && (
                  <Link
                    href={user.role === 'super_admin' ? '/admin' : `/${user.chapterId}/edit`}
                    onClick={handleClose}
                    className="hover:bg-wial-navy-light block rounded px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white"
                  >
                    Dashboard
                  </Link>
                )}
                <form action={logoutAction}>
                  <Button
                    type="submit"
                    variant="ghost"
                    fullWidth
                    className="hover:bg-wial-navy-light justify-start rounded px-3 py-2.5 text-start text-sm font-medium text-white/80 hover:text-white"
                  >
                    Log Out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={handleClose}
                  className="hover:bg-wial-navy-light block rounded px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={handleClose}
                  className="bg-wial-red hover:bg-wial-red-dark block rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
