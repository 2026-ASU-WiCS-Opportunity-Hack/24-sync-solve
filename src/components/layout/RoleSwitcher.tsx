'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Building2, ChevronDown } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/utils/constants'
import type { UserRole } from '@/types'

interface ChapterRoleEntry {
  chapterId: string
  chapterName: string
  chapterSlug: string
  roles: UserRole[]
}

interface RoleSwitcherProps {
  chapters: ChapterRoleEntry[]
}

/**
 * Compact dropdown in the header showing chapters the user can manage.
 * Rendered only when the user has active chapter roles (chapter_lead or content_editor).
 */
export function RoleSwitcher({ chapters }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (chapters.length === 0) return null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-brand-shell)]/90 transition-colors hover:bg-red-50 hover:text-[var(--color-brand-shell)] focus:ring-2 focus:ring-[var(--color-brand-shell)] focus:outline-none"
        aria-label="Switch chapter context"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Building2 size={15} aria-hidden="true" />
        <span>Manage</span>
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute start-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg"
          aria-label="Chapter management"
        >
          <div className="border-b border-gray-100 px-4 py-2">
            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Your Chapters
            </p>
          </div>
          <div className="py-1">
            {chapters.map((ch) => (
              <Link
                key={ch.chapterId}
                href={`/${ch.chapterSlug}/manage`}
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-start gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Building2 size={13} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{ch.chapterName}</p>
                  <p className="text-xs text-gray-500">
                    {ch.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
