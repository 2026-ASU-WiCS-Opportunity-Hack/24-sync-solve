'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('nav')

  const handleClose = () => setIsOpen(false)

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-wial-navy-light rounded-full p-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          id="mobile-menu"
          className="border-wial-navy-dark bg-wial-navy absolute inset-x-3 top-[calc(100%+0.5rem)] z-50 rounded-2xl border p-2 shadow-2xl"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="space-y-1 px-2 py-2">
            {(chapterSlug ? CHAPTER_NAV_LINKS : GLOBAL_NAV_LINKS).map((link) => (
              <Link
                key={link.href}
                href={chapterSlug ? `/${chapterSlug}${link.href}` : link.href}
                onClick={handleClose}
                className="hover:bg-wial-navy-light block rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white"
              >
                {t(link.labelKey.replace('nav.', '') as Parameters<typeof t>[0])}
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
                    className="hover:bg-wial-navy-light block rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white"
                  >
                    {t('dashboard')}
                  </Link>
                )}
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="hover:bg-wial-navy-light w-full rounded-lg px-3 py-2.5 text-start text-sm font-medium text-white/80 hover:text-white"
                  >
                    {t('logout')}
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={handleClose}
                  className="hover:bg-wial-navy-light block rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  onClick={handleClose}
                  className="bg-wial-red hover:bg-wial-red-dark mt-1 block rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-white"
                >
                  {t('register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
