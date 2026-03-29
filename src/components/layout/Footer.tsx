import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { GLOBAL_NAV_LINKS } from '@/lib/utils/constants'
import { getGlobalSettings } from '@/features/settings/queries/getSettings'
import { updateGlobalSetting } from '@/features/settings/actions/updateSetting'
import { InlineEditableText } from '@/components/editor/InlineEditableText'

interface FooterProps {
  /** Whether the current viewer is super_admin (controls edit affordances) */
  isSuperAdmin?: boolean
}

export async function Footer({ isSuperAdmin = false }: FooterProps) {
  const t = await getTranslations()

  const supabase = await createClient()

  // Fetch active chapters and editable settings in parallel
  const [{ data: chapters }, settings] = await Promise.all([
    supabase.from('chapters').select('slug, name').eq('is_active', true).order('name').limit(8),
    getGlobalSettings(supabase, ['footer.tagline']),
  ])

  const footerTagline = settings['footer.tagline'] ?? t('footer.tagline')
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-wial-navy border-t border-gray-200 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-extrabold text-white">WIAL</span>
              <span className="mt-1 block text-xs font-semibold tracking-widest text-white/60 uppercase">
                World Institute for Action Learning
              </span>
            </Link>

            <InlineEditableText
              value={footerTagline}
              onSave={updateGlobalSetting.bind(null, 'footer.tagline')}
              isSuperAdmin={isSuperAdmin}
              as="p"
              className="mt-4 max-w-sm text-sm leading-relaxed text-white/70"
              label="Footer tagline"
            />
          </div>

          {/* Quick links */}
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-white/50 uppercase">
              {t('footer.links.heading')}
            </h2>
            <ul className="mt-4 space-y-2" role="list">
              {GLOBAL_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {t(`nav.${link.labelKey.replace('nav.', '')}` as Parameters<typeof t>[0])}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Chapters */}
          {chapters && chapters.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold tracking-wider text-white/50 uppercase">
                {t('footer.chapters.heading')}
              </h2>
              <ul className="mt-4 space-y-2" role="list">
                {chapters.map((chapter) => (
                  <li key={chapter.slug}>
                    <Link
                      href={`/${chapter.slug}`}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {chapter.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/50">
            {t('footer.legal.copyright', { year: currentYear })}
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-xs text-white/50 hover:text-white/70">
              {t('footer.legal.privacy')}
            </Link>
            <Link href="/terms" className="text-xs text-white/50 hover:text-white/70">
              {t('footer.legal.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
