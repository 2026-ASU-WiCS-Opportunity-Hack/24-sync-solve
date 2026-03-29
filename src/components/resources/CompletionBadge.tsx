'use client'

import { CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface CompletionBadgeProps {
  completed: boolean
}

export function CompletionBadge({ completed }: CompletionBadgeProps) {
  const t = useTranslations('resources.completion')
  if (!completed) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
      <CheckCircle size={11} aria-hidden="true" />
      {t('completed')}
    </span>
  )
}
