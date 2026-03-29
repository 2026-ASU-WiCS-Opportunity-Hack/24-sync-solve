'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@heroui/react'

interface ResourceScopeToggleProps {
  currentScope: 'chapter' | 'all'
  chapterName: string
}

export function ResourceScopeToggle({ currentScope, chapterName }: ResourceScopeToggleProps) {
  const t = useTranslations('resources.scope')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function setScope(scope: 'chapter' | 'all') {
    const params = new URLSearchParams(searchParams.toString())
    if (scope === 'all') {
      params.set('scope', 'all')
    } else {
      params.delete('scope')
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm ${isPending ? 'opacity-60' : ''}`}
      role="group"
      aria-label="Resource scope"
    >
      <Button
        type="button"
        onPress={() => setScope('chapter')}
        variant={currentScope === 'chapter' ? 'primary' : 'ghost'}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
          currentScope === 'chapter'
            ? 'bg-wial-navy text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        aria-pressed={currentScope === 'chapter'}
      >
        {chapterName}
      </Button>
      <Button
        type="button"
        onPress={() => setScope('all')}
        variant={currentScope === 'all' ? 'primary' : 'ghost'}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
          currentScope === 'all'
            ? 'bg-wial-navy text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        aria-pressed={currentScope === 'all'}
      >
        {t('all')}
      </Button>
    </div>
  )
}
