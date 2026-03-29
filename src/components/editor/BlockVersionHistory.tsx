'use client'

import { useState, useEffect, useTransition } from 'react'
import { History, RotateCcw, Loader2, Clock } from 'lucide-react'
import {
  fetchVersionHistoryAction,
  revertToVersionAction,
} from '@/features/content/actions/versionHistory'
import type { ContentVersionItem } from '@/features/content/actions/versionHistory'
import { formatDate } from '@/lib/utils/format'

interface BlockVersionHistoryProps {
  blockId: string
  onReverted: () => void
}

export function BlockVersionHistory({ blockId, onReverted }: BlockVersionHistoryProps) {
  const [versions, setVersions] = useState<ContentVersionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [revertingId, setRevertingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revertError, setRevertError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchVersionHistoryAction(blockId)
      .then((data) => {
        if (!cancelled) {
          setVersions(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load version history.')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [blockId])

  function handleRevert(versionId: string) {
    setRevertError(null)
    setRevertingId(versionId)
    startTransition(async () => {
      const result = await revertToVersionAction(blockId, versionId)
      if (!result.success) {
        setRevertError(result.error ?? 'Revert failed.')
        setRevertingId(null)
        return
      }
      onReverted()
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-gray-400" aria-hidden="true" />
        <span className="sr-only">Loading version history…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div className="py-12 text-center">
        <History size={32} className="mx-auto mb-3 text-gray-300" aria-hidden="true" />
        <p className="text-sm text-gray-500">No version history yet.</p>
        <p className="mt-1 text-xs text-gray-400">
          Versions are saved each time the block is edited.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {revertError && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {revertError}
        </div>
      )}

      <ul className="divide-y divide-gray-100" aria-label="Version history">
        {versions.map((version, idx) => {
          const isReverting = revertingId === version.id && isPending
          const isLatest = idx === 0

          return (
            <li key={version.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">
                    v{version.version_number}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      version.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : version.status === 'pending_approval'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {version.status === 'pending_approval' ? 'pending' : version.status}
                  </span>
                  {isLatest && <span className="text-xs font-medium text-blue-600">latest</span>}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                  <Clock size={11} aria-hidden="true" />
                  <time dateTime={version.created_at}>{formatDate(version.created_at)}</time>
                  {version.changed_by_name && <span>· {version.changed_by_name}</span>}
                </div>
              </div>

              {!isLatest && (
                <button
                  type="button"
                  onClick={() => handleRevert(version.id)}
                  disabled={isReverting || (isPending && revertingId !== null)}
                  aria-label={`Revert to version ${version.version_number}`}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 focus:ring-2 focus:ring-amber-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isReverting ? (
                    <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <RotateCcw size={12} aria-hidden="true" />
                  )}
                  {isReverting ? 'Reverting…' : 'Revert'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
