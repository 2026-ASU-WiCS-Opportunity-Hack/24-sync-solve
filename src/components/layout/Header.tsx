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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#022a54]/95 via-[#003366]/95 to-[#012a4f]/95 shadow-[0_14px_34px_-20px_rgba(0,0,0,0.72)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={logoHref}
          className="focus:ring-offset-wial-navy flex items-center gap-2.5 rounded-xl px-1.5 py-1 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:outline-none"
          aria-label={`${logoName} home`}
        >
          <span className="text-[1.35rem] leading-none font-black tracking-tight text-white">
            WIAL
          </span>
          {chapterName && (
            <span className="hidden rounded-full border border-white/20 bg-white/12 px-2.5 py-1 text-xs font-semibold text-white/90 sm:block">
              {chapterName}
            </span>
          )}
          {!chapterName && (
            <span className="hidden text-[11px] leading-none font-semibold tracking-[0.18em] text-white/70 uppercase sm:block">
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
              className="rounded-full border border-transparent px-3.5 py-2 text-sm font-medium text-white/85 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white focus:ring-2 focus:ring-white focus:outline-none"
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
        <div className="h-1 w-full" style={{ backgroundColor: accentColor }} aria-hidden="true" />
      )}
    </header>
  )
}
