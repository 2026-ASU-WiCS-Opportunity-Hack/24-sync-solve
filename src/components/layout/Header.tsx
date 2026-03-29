import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { GLOBAL_NAV_LINKS, CHAPTER_NAV_LINKS } from '@/lib/utils/constants'
import { getGlobalSettings } from '@/features/settings/queries/getSettings'
import { updateGlobalSetting } from '@/features/settings/actions/updateSetting'
import { MobileNav } from '@/components/layout/MobileNav'
import { UserMenu } from '@/components/layout/UserMenu'
import { RoleSwitcher } from '@/components/layout/RoleSwitcher'
import { InlineEditableText } from '@/components/editor/InlineEditableText'
import type { AuthUser, UserRole } from '@/types'

interface HeaderProps {
  accentColor?: string
  chapterSlug?: string
  chapterName?: string
  /** Whether the current viewer is super_admin (controls edit affordances) */
  isSuperAdmin?: boolean
}

export async function Header({
  accentColor,
  chapterSlug,
  chapterName,
  isSuperAdmin = false,
}: HeaderProps) {
  const t = await getTranslations('nav')

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let currentUser: AuthUser | null = null
  const managedChapters: {
    chapterId: string
    chapterName: string
    chapterSlug: string
    roles: UserRole[]
  }[] = []

  if (authUser) {
    const [profileResult, chapterRolesResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('role, chapter_id, full_name, avatar_url, is_suspended, membership_status')
        .eq('id', authUser.id)
        .single(),
      supabase
        .from('user_chapter_roles')
        .select(
          'role, chapter_id, chapter:chapters!user_chapter_roles_chapter_id_fkey(id, name, slug)'
        )
        .eq('user_id', authUser.id)
        .eq('is_active', true),
    ])

    const profile = profileResult.data

    const chapterRolesMap: Record<string, UserRole[]> = {}
    for (const row of chapterRolesResult.data ?? []) {
      const cid = row.chapter_id
      if (!chapterRolesMap[cid]) chapterRolesMap[cid] = []
      chapterRolesMap[cid].push(row.role as UserRole)
    }

    currentUser = {
      id: authUser.id,
      email: authUser.email ?? '',
      role: (profile?.role ?? 'user') as UserRole,
      chapterId: profile?.chapter_id ?? null,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      isSuspended: profile?.is_suspended ?? false,
      membershipStatus: (profile?.membership_status ?? 'none') as AuthUser['membershipStatus'],
      chapterRoles: chapterRolesMap,
    }

    const managementRoles: UserRole[] = ['chapter_lead', 'content_editor']
    const seen = new Set<string>()
    for (const row of chapterRolesResult.data ?? []) {
      if (!managementRoles.includes(row.role as UserRole)) continue
      const chap = row.chapter as { id: string; name: string; slug: string } | null
      if (!chap || seen.has(chap.id)) continue
      seen.add(chap.id)
      const roles = chapterRolesMap[chap.id]?.filter((r) => managementRoles.includes(r)) ?? []
      managedChapters.push({
        chapterId: chap.id,
        chapterName: chap.name,
        chapterSlug: chap.slug,
        roles,
      })
    }

    if (profile?.role === 'chapter_lead' && profile.chapter_id && !seen.has(profile.chapter_id)) {
      const { data: primaryChap } = await supabase
        .from('chapters')
        .select('id, name, slug')
        .eq('id', profile.chapter_id)
        .single()
      if (primaryChap) {
        managedChapters.push({
          chapterId: primaryChap.id,
          chapterName: primaryChap.name,
          chapterSlug: primaryChap.slug,
          roles: ['chapter_lead'],
        })
      }
    }
  }

  // Fetch editable global settings (only used on the global site header)
  const settings = chapterSlug ? {} : await getGlobalSettings(supabase, ['header.site_subtitle'])

  const siteSubtitle = settings['header.site_subtitle'] ?? 'Action Learning'

  const logoHref = chapterSlug ? `/${chapterSlug}` : '/'
  const logoName = chapterName ? `WIAL ${chapterName}` : 'WIAL'

  return (
    <header className="sticky top-0 z-50 border-b border-red-200 bg-white text-[var(--color-brand-shell)] shadow-[0_8px_24px_rgb(15_23_42/0.08)]">
      <div className="h-1 w-full bg-[var(--color-brand-shell-strong)]" aria-hidden="true" />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={logoHref}
          className="flex items-center gap-2 rounded focus:ring-2 focus:ring-[var(--color-brand-shell)] focus:ring-offset-2 focus:ring-offset-white focus:outline-none"
          aria-label={`${logoName} home`}
        >
          <Image
            src="/logo.png"
            alt="WIAL"
            width={140}
            height={44}
            priority
            className="h-9 w-auto"
          />
          {chapterName && (
            <span className="hidden text-sm font-semibold text-[var(--color-brand-shell)]/80 sm:block">
              {chapterName}
            </span>
          )}
          {!chapterName && (
            <InlineEditableText
              value={siteSubtitle}
              onSave={updateGlobalSetting.bind(null, 'header.site_subtitle')}
              isSuperAdmin={isSuperAdmin}
              as="span"
              className="hidden text-xs font-medium tracking-[0.18em] text-[var(--color-brand-shell)]/70 uppercase sm:block"
              label="Site subtitle (next to logo)"
            />
          )}
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Main navigation" className="hidden lg:flex lg:items-center lg:gap-1">
          {(chapterSlug ? CHAPTER_NAV_LINKS : GLOBAL_NAV_LINKS).map((link) => (
            <Link
              key={link.href}
              href={chapterSlug ? `/${chapterSlug}${link.href}` : link.href}
              className="rounded px-3 py-2 text-sm font-medium text-[var(--color-brand-shell)]/90 transition-colors hover:bg-red-50 hover:text-[var(--color-brand-shell)] focus:ring-2 focus:ring-[var(--color-brand-shell)] focus:outline-none"
            >
              {t(link.labelKey.replace('nav.', '') as Parameters<typeof t>[0])}
            </Link>
          ))}

          {/* Role switcher — for users managing chapters */}
          {managedChapters.length > 0 && <RoleSwitcher chapters={managedChapters} />}
        </nav>

        {/* Right side: auth + mobile menu */}
        <div className="flex items-center gap-3">
          {/* Chapter accent bar */}
          {accentColor && (
            <div
              className="hidden h-6 w-1 rounded-full lg:block"
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
