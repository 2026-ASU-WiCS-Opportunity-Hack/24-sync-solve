'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, Clock, XCircle, Award } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { applyForCertificationAction } from '@/features/resources/actions/applyForCertification'
import { CERTIFICATION_LEVEL_NAMES } from '@/features/resources/types'
import type { CertificationProgress, CertificationLevel } from '@/features/resources/types'

interface CertificationProgressSectionProps {
  progress: CertificationProgress[]
}

const STATUS_ICONS = {
  pending_approval: Clock,
  approved: CheckCircle,
  expired: XCircle,
  revoked: XCircle,
}

const STATUS_CLASSES = {
  pending_approval: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  expired: 'bg-gray-100 text-gray-500',
  revoked: 'bg-red-50 text-red-600',
}

function CertLevelCard({ item }: { item: CertificationProgress }) {
  const t = useTranslations('resources.certification')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleApply(level: CertificationLevel) {
    setError(null)
    startTransition(async () => {
      const result = await applyForCertificationAction(level)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error)
      }
    })
  }

  const status = item.existing?.status
  const StatusIcon = status ? STATUS_ICONS[status] : null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Level header */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">{item.level}</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900">
            {CERTIFICATION_LEVEL_NAMES[item.level]}
          </p>
        </div>

        {/* Status badge */}
        {status && StatusIcon && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[status]}`}
          >
            <StatusIcon size={11} aria-hidden="true" />
            {t(
              status === 'pending_approval'
                ? 'pending'
                : status === 'approved'
                  ? 'approved'
                  : status === 'expired'
                    ? 'expired'
                    : 'revoked'
            )}
            {status === 'approved' && item.existing?.expires_at && (
              <span className="opacity-70">
                ·{' '}
                {t('expiresOn', { date: new Date(item.existing.expires_at).toLocaleDateString() })}
              </span>
            )}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {item.totalRequired > 0 ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {t('progress', {
                completed: item.completedRequired,
                total: item.totalRequired,
              })}
            </span>
            <span className="font-semibold text-gray-700">{item.percentage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="bg-wial-navy h-full rounded-full transition-all duration-500"
              style={{ width: `${item.percentage}%` }}
              role="progressbar"
              aria-valuenow={item.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${item.level} progress: ${item.percentage}%`}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400">{t('noRequirements')}</p>
      )}

      {/* Apply button */}
      {item.canApply && !success && (
        <div className="mt-4">
          {error && (
            <p className="mb-2 text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => handleApply(item.level)}
            disabled={isPending}
            className="bg-wial-navy hover:bg-wial-navy-dark inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-60"
          >
            <Award size={13} aria-hidden="true" />
            {isPending ? '…' : t('apply', { level: item.level })}
          </button>
        </div>
      )}

      {success && (
        <p
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-green-700"
          role="status"
        >
          <CheckCircle size={13} aria-hidden="true" />
          {t('applySuccess')}
        </p>
      )}
    </div>
  )
}

export function CertificationProgressSection({ progress }: CertificationProgressSectionProps) {
  const t = useTranslations('resources.certification')
  const hasAnyRequirements = progress.some((p) => p.totalRequired > 0)

  if (!hasAnyRequirements) {
    return <p className="text-sm text-gray-400">{t('noRequirements')}</p>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {progress.map((item) => (
        <CertLevelCard key={item.level} item={item} />
      ))}
    </div>
  )
}
