'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteResourceAction } from '@/features/resources/actions/manageResources'
import { toast } from 'sonner'

interface DeleteResourceButtonProps {
  resourceId: string
  resourceTitle: string
  chapterId: string | null
}

export function DeleteResourceButton({
  resourceId,
  resourceTitle,
  chapterId,
}: DeleteResourceButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Delete "${resourceTitle}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteResourceAction(resourceId, chapterId)
      if (result.success) {
        toast.success('Resource deleted.')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      aria-label={`Delete ${resourceTitle}`}
      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 size={12} className="animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 size={12} aria-hidden="true" />
      )}
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
