'use client'

import { useState, useTransition } from 'react'
import { ExternalLink } from 'lucide-react'
import { completeResourceAction } from '@/features/resources/actions/completeResource'
import { CompletionBadge } from '@/components/resources/CompletionBadge'

interface ResourceCardClientProps {
  resourceId: string
  initialCompleted: boolean
  resourceUrl: string
  isExternal: boolean
  ctaLabel: string
}

export function ResourceCardClient({
  resourceId,
  initialCompleted,
  resourceUrl,
  isExternal,
  ctaLabel,
}: ResourceCardClientProps) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [_isPending, startTransition] = useTransition()

  function handleClick() {
    if (!completed) {
      // Optimistic update — mark complete immediately without blocking navigation
      setCompleted(true)
      startTransition(async () => {
        await completeResourceAction(resourceId)
      })
    }
  }

  return (
    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
      <a
        href={resourceUrl}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        onClick={handleClick}
        className="text-wial-red hover:text-wial-red-dark inline-flex items-center gap-1 text-xs font-semibold"
      >
        {ctaLabel}
        <ExternalLink size={10} aria-hidden="true" />
        {isExternal && <span className="sr-only"> (opens in new tab)</span>}
      </a>
      <CompletionBadge completed={completed} />
    </div>
  )
}
