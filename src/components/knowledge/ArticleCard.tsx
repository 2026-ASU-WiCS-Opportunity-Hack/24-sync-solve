'use client'

import { useState } from 'react'
import type { JournalArticle } from '@/features/knowledge/types'
import type { UserRole } from '@/types'

type Lang = 'en' | 'es' | 'pt' | 'fr'
const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
}

interface ArticleCardProps {
  article: JournalArticle
  userRole: UserRole | null
}

export function ArticleCard({ article, userRole }: ArticleCardProps) {
  const [lang, setLang] = useState<Lang>('en')

  const currentSummary =
    lang === 'en' ? article.summary : (article.translations?.[lang]?.summary ?? article.summary)

  const canDownload = userRole && userRole !== 'public'

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <div className="flex-col items-start px-6 pt-6 pb-0">
        <h3 className="text-wial-navy line-clamp-2 text-xl font-bold" title={article.title}>
          {article.title}
        </h3>
        {article.authors && article.authors.length > 0 && (
          <p className="mt-1 line-clamp-1 text-sm text-gray-500">
            {article.authors.join(', ')} &bull; {article.published_year}
          </p>
        )}
      </div>

      <div className="flex-grow px-6 py-4">
        {/* Language selector */}
        <div className="mb-4 flex gap-2 border-b pb-2" role="group" aria-label="Summary language">
          {(['en', 'es', 'pt', 'fr'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                lang === l
                  ? 'bg-wial-red/10 text-wial-red font-semibold'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
        <p className="line-clamp-4 text-sm leading-relaxed text-gray-700">{currentSummary}</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-b-xl px-6 pt-0 pb-6">
        {article.relevance_tags?.map((tag) => (
          <span
            key={tag}
            className="rounded bg-gray-100 px-2 py-1 text-[10px] font-medium tracking-wider text-gray-600 uppercase"
          >
            {tag}
          </span>
        ))}
        {article.pdf_url && canDownload && (
          <a
            href={article.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-wial-red mt-auto ms-auto block pt-2 text-right text-xs font-semibold hover:underline"
          >
            Read Full Text &rarr;
          </a>
        )}
        {article.pdf_url && !canDownload && (
          <span
            className="mt-auto ms-auto block pt-2 text-right text-xs font-semibold text-gray-400"
            title="Log in as a coach or admin to read the full text"
          >
            Full PDF Restricted
          </span>
        )}
      </div>
    </div>
  )
}
