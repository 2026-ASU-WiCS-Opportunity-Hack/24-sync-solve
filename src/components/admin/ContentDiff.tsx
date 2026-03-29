'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface ContentDiffProps {
  published: Record<string, unknown> | null
  draft: Record<string, unknown>
  blockType: string
}

/**
 * Renders a side-by-side (or stacked) diff of published vs draft content.
 * Highlights changed keys so reviewers know what changed.
 */
export function ContentDiff({ published, draft, blockType: _blockType }: ContentDiffProps) {
  const [expanded, setExpanded] = useState(false)

  const changedKeys = getChangedKeys(published, draft)
  const hasChanges = changedKeys.length > 0

  return (
    <div className="space-y-3">
      {/* Summary line */}
      <div className="flex items-center gap-2">
        {hasChanges ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {changedKeys.length} field{changedKeys.length !== 1 ? 's' : ''} changed
          </span>
        ) : (
          <span className="text-xs text-gray-500">New block</span>
        )}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:underline focus:outline-none"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <ChevronDown size={12} aria-hidden="true" /> Hide diff
            </>
          ) : (
            <>
              <ChevronRight size={12} aria-hidden="true" /> Show diff
            </>
          )}
        </button>
      </div>

      {/* Diff table */}
      {expanded && (
        <div className="overflow-hidden rounded-lg border border-gray-200 text-xs">
          {/* Changed fields */}
          {changedKeys.map((key) => {
            const prev = published?.[key]
            const next = draft[key]
            return (
              <DiffRow
                key={key}
                field={key}
                published={prev}
                draft={next}
                isNew={published === null}
              />
            )
          })}

          {/* Unchanged fields (collapsed) */}
          {Object.keys(draft).filter((k) => !changedKeys.includes(k)).length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 text-gray-400 italic">
              {Object.keys(draft).filter((k) => !changedKeys.includes(k)).length} unchanged field(s)
              hidden
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface DiffRowProps {
  field: string
  published: unknown
  draft: unknown
  isNew: boolean
}

function DiffRow({ field, published, draft, isNew }: DiffRowProps) {
  const pubStr = formatValue(published)
  const draftStr = formatValue(draft)

  return (
    <div className="grid grid-cols-[120px_1fr_1fr] border-b border-gray-100 last:border-0">
      <div className="flex items-start bg-gray-50 px-3 py-2 font-mono font-semibold text-gray-500">
        {field}
      </div>
      <div
        className="border-e border-gray-100 px-3 py-2 text-red-700"
        aria-label={`Published value for ${field}`}
      >
        {isNew ? (
          <span className="text-gray-400 italic">—</span>
        ) : (
          <span className="line-through opacity-70">{pubStr}</span>
        )}
      </div>
      <div
        className="bg-green-50 px-3 py-2 text-green-800"
        aria-label={`Proposed value for ${field}`}
      >
        {draftStr}
      </div>
    </div>
  )
}

function getChangedKeys(
  published: Record<string, unknown> | null,
  draft: Record<string, unknown>
): string[] {
  if (published === null) {
    // All keys are "new"
    return Object.keys(draft)
  }
  return Object.keys(draft).filter((key) => {
    return JSON.stringify(draft[key]) !== JSON.stringify(published[key])
  })
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value.slice(0, 120) + (value.length > 120 ? '…' : '')
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return `[${value.length} item${value.length !== 1 ? 's' : ''}]`
  if (typeof value === 'object') return `{${Object.keys(value as object).join(', ')}}`
  return String(value)
}
