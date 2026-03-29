'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteEventAction } from '@/features/events/actions/manageEvents'
import { toast } from 'sonner'

interface DeleteEventButtonProps {
  eventId: string
  eventTitle: string
  chapterId: string
  chapterSlug: string
}

export function DeleteEventButton({
  eventId,
  eventTitle,
  chapterId,
  chapterSlug: _chapterSlug,
}: DeleteEventButtonProps) {
  const [isPending, startTransition] = useTransition()

  async function handleDelete() {
    if (!confirm(`Delete "${eventTitle}"? This cannot be undone.`)) return

    startTransition(async () => {
      const result = await deleteEventAction(chapterId, eventId)
      if (result.success) {
        toast.success(result.message ?? 'Event deleted.')
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
      aria-label={`Delete ${eventTitle}`}
      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 size={12} className="animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 size={12} aria-hidden="true" />
      )}
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
