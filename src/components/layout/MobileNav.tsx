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
        className="rounded p-2 text-[var(--color-brand-shell)] hover:bg-red-50"
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
          className="absolute inset-x-0 top-full z-50 border-t border-red-200 bg-white shadow-[0_12px_28px_rgb(15_23_42/0.14)]"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="space-y-1 px-4 pt-2 pb-4">
            {(chapterSlug ? CHAPTER_NAV_LINKS : GLOBAL_NAV_LINKS).map((link) => (
              <Link
                key={link.href}
                href={chapterSlug ? `/${chapterSlug}${link.href}` : link.href}
                onClick={handleClose}
                className="block rounded px-3 py-2.5 text-sm font-medium text-[var(--color-brand-shell)]/90 hover:bg-red-50 hover:text-[var(--color-brand-shell)]"
              >
                {link.labelKey.replace('nav.', '')}
              </Link>
            ))}

            <div className="my-2 border-t border-red-200" />

            {user ? (
              <>
                <div className="px-3 py-2 text-xs text-[var(--color-brand-shell)]/65">
                  {user.email}
                </div>
                {(user.role === 'super_admin' || user.role === 'chapter_lead') && (
                  <Link
                    href={user.role === 'super_admin' ? '/admin' : `/${user.chapterId}/edit`}
                    onClick={handleClose}
                    className="block rounded px-3 py-2.5 text-sm font-medium text-[var(--color-brand-shell)]/90 hover:bg-red-50 hover:text-[var(--color-brand-shell)]"
                  >
                    Dashboard
                  </Link>
                )}
                <form action={logoutAction}>
                  <Button
                    type="submit"
                    variant="ghost"
                    fullWidth
                    className="justify-start rounded px-3 py-2.5 text-start text-sm font-medium text-[var(--color-brand-shell)]/90 hover:bg-red-50 hover:text-[var(--color-brand-shell)]"
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
                  className="block rounded px-3 py-2.5 text-sm font-medium text-[var(--color-brand-shell)]/90 hover:bg-red-50 hover:text-[var(--color-brand-shell)]"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={handleClose}
                  className="block rounded-lg border border-[var(--color-brand-shell)] px-3 py-2.5 text-center text-sm font-semibold text-[var(--color-brand-shell)] hover:bg-red-50"
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
