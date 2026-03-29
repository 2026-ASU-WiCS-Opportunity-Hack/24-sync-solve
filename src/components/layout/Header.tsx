import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { GLOBAL_NAV_LINKS, CHAPTER_NAV_LINKS } from '@/lib/utils/constants'
import { MobileNav } from '@/components/layout/MobileNav'
import { UserMenu } from '@/components/layout/UserMenu'
import type { AuthUser } from '@/types'

interface HeaderProps {
  accentColor?: string
  chapterSlug?: string
  chapterName?: string
}

export async function Header({ accentColor, chapterSlug, chapterName }: HeaderProps) {
  const t = await getTranslations('nav')

  // Get current user (server-side — secure)
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let currentUser: AuthUser | null = null
  if (authUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, chapter_id, full_name, avatar_url')
      .eq('id', authUser.id)
      .single()

    currentUser = {
      id: authUser.id,
      email: authUser.email ?? '',
      role: profile?.role ?? 'public',
      chapterId: profile?.chapter_id ?? null,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    }
  }

  const logoHref = chapterSlug ? `/${chapterSlug}` : '/'
  const logoName = chapterName ? `WIAL ${chapterName}` : 'WIAL'

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 shadow-[0_10px_26px_-20px_rgba(15,39,71,0.45)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={logoHref}
          className="flex items-center gap-2.5 rounded-xl px-1 py-1 focus:ring-2 focus:ring-[#003366] focus:outline-none"
          aria-label={`${logoName} home`}
        >
          <span className="bg-wial-navy rounded-full px-3 py-1 text-sm leading-none font-black tracking-wide text-white">
            WIAL
          </span>
          {chapterName && (
            <span className="hidden rounded-full border border-gray-300 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 sm:block">
              {chapterName}
            </span>
          )}
          {!chapterName && (
            <span className="hidden text-[11px] leading-none font-semibold tracking-[0.16em] text-gray-500 uppercase sm:block">
              Action Learning
            </span>
          )}
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Main navigation" className="hidden lg:flex lg:items-center lg:gap-1.5">
          {(chapterSlug ? CHAPTER_NAV_LINKS : GLOBAL_NAV_LINKS).map((link) => (
            <Link
              key={link.href}
              href={chapterSlug ? `/${chapterSlug}${link.href}` : link.href}
              className="rounded-full border border-gray-300 px-3.5 py-2 text-sm font-semibold text-[#0f3f76] transition-all hover:border-[#003366]/35 hover:bg-[#003366]/6 focus:ring-2 focus:ring-[#003366] focus:outline-none"
            >
              {t(link.labelKey.replace('nav.', '') as Parameters<typeof t>[0])}
            </Link>
          ))}
        </nav>

        {/* Right side: auth + mobile menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Chapter accent bar */}
          {accentColor && (
            <div
              className="hidden h-7 w-1.5 rounded-full lg:block"
              style={{ backgroundColor: accentColor }}
              aria-hidden="true"
            />
          )}

          {/* Auth buttons / User menu */}
          <div className="hidden lg:block">
            <UserMenu user={currentUser} />
          </div>

          {/* Mobile menu toggle */}
          <MobileNav chapterSlug={chapterSlug} chapterName={chapterName} user={currentUser} />
        </div>
      </div>

      {/* Chapter accent stripe */}
      {accentColor && (
        <div className="h-0.5 w-full" style={{ backgroundColor: accentColor }} aria-hidden="true" />
      )}
    </header>
  )
}
