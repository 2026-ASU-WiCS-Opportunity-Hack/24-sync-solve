'use client'

import { useTransition } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { updateCoachStatusAction } from '@/features/coaches/actions/updateCoachStatus'
import { toast } from 'sonner'

interface CoachStatusToggleProps {
  coachId: string
  coachName: string
  field: 'published' | 'verified'
  currentValue: boolean
}

const ACTION_MAP = {
  published: {
    activate: 'publish',
    deactivate: 'unpublish',
  },
  verified: {
    activate: 'verify',
    deactivate: 'unverify',
  },
} as const

export function CoachStatusToggle({
  coachId,
  coachName,
  field,
  currentValue,
}: CoachStatusToggleProps) {
  const [isPending, startTransition] = useTransition()

  async function handleToggle() {
    const action = currentValue ? ACTION_MAP[field].deactivate : ACTION_MAP[field].activate

    const formData = new FormData()
    formData.set('coach_id', coachId)
    formData.set('action', action)

    startTransition(async () => {
      const result = await updateCoachStatusAction(null, formData)
      if (result.success) {
        toast.success(result.message ?? 'Updated.')
      } else {
        toast.error(result.error)
      }
    })
  }

  const label = currentValue
    ? `${field === 'published' ? 'Unpublish' : 'Unverify'} ${coachName}`
    : `${field === 'published' ? 'Publish' : 'Verify'} ${coachName}`

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={label}
      title={label}
      className="disabled:cursor-not-allowed"
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin text-gray-400" />
      ) : currentValue ? (
        <CheckCircle size={16} className="text-green-500 transition-colors hover:text-yellow-500" />
      ) : (
        <XCircle size={16} className="text-gray-300 transition-colors hover:text-green-500" />
      )}
    </button>
  )
}
