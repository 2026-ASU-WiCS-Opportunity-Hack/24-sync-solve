'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useRef } from 'react'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button, Input } from '@heroui/react'
import type { ResourceType } from '@/features/resources/types'
import { RESOURCE_TYPE_LABELS } from '@/features/resources/types'

const TYPES: ResourceType[] = ['video', 'article', 'pdf', 'link']

interface ResourceFiltersProps {
  currentType: ResourceType | null
  currentCategory: string | null
  currentSearch: string | null
  categories: string[]
}

export function ResourceFilters({
  currentType,
  currentCategory,
  currentSearch,
  categories,
}: ResourceFiltersProps) {
  const t = useTranslations('resources')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setParam('q', value.trim() || null)
    }, 300)
  }

  const tabBase = 'rounded-full px-3 py-1.5 text-xs font-semibold'
  const tabActive = 'bg-wial-navy text-white'
  const tabInactive = 'bg-gray-100 text-gray-600 hover:bg-gray-200'

  return (
    <div className={`space-y-4 ${isPending ? 'opacity-60' : ''}`}>
      {/* Type + category filters */}
      <div className="flex flex-wrap gap-2" aria-label={t('filters.filterByType')}>
        <Button
          type="button"
          onPress={() => setParam('type', null)}
          className={`${tabBase} ${currentType === null ? tabActive : tabInactive}`}
          aria-pressed={currentType === null}
          variant="ghost"
        >
          {t('filters.all')}
        </Button>
        {TYPES.map((type) => (
          <Button
            key={type}
            type="button"
            onPress={() => setParam('type', currentType === type ? null : type)}
            className={`${tabBase} ${currentType === type ? tabActive : tabInactive}`}
            aria-pressed={currentType === type}
            variant="ghost"
          >
            {RESOURCE_TYPE_LABELS[type]}
          </Button>
        ))}

        {categories.length > 0 && (
          <>
            <span className="self-center text-gray-300" aria-hidden="true">
              |
            </span>
            {categories.map((cat) => (
              <Button
                key={cat}
                type="button"
                onPress={() => setParam('category', currentCategory === cat ? null : cat)}
                className={`${tabBase} ${currentCategory === cat ? tabActive : tabInactive}`}
                aria-pressed={currentCategory === cat}
                variant="ghost"
              >
                {cat}
              </Button>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
