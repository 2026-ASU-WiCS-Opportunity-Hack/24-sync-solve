'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { approveContentBlock, rejectContentBlock } from '@/features/content/queries/getApprovals'
import { createClient } from '@/lib/supabase/client'
import { Check, X } from 'lucide-react'

interface ApprovalActionsProps {
  blockId: string
  approverUserId: string
}

export function ApprovalActions({ blockId, approverUserId }: ApprovalActionsProps) {
  const router = useRouter()
  const [isPendingApprove, startApprove] = useTransition()
  const [isPendingReject, startReject] = useTransition()
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  async function handleApprove() {
    startApprove(async () => {
      const supabase = createClient()
      const { error } = await approveContentBlock(supabase, blockId, approverUserId)
      if (error) {
        toast.error(`Approval failed: ${error}`)
      } else {
        toast.success('Content approved and published.')
        router.refresh()
      }
    })
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection.')
      return
    }
    startReject(async () => {
      const supabase = createClient()
      const { error } = await rejectContentBlock(supabase, blockId, approverUserId, rejectionReason)
      if (error) {
        toast.error(`Rejection failed: ${error}`)
      } else {
        toast.success('Content rejected.')
        setShowRejectForm(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      {!showRejectForm ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleApprove}
            disabled={isPendingApprove || isPendingReject}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            <Check size={13} aria-hidden="true" />
            {isPendingApprove ? 'Approving…' : 'Approve'}
          </button>
          <button
            type="button"
            onClick={() => setShowRejectForm(true)}
            disabled={isPendingApprove}
            className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <X size={13} aria-hidden="true" />
            Reject
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor={`reason-${blockId}`} className="block text-xs font-medium text-gray-700">
            Reason for rejection <span className="text-red-500">*</span>
          </label>
          <textarea
            id={`reason-${blockId}`}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={2}
            placeholder="Explain why this content was rejected..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-red-400 focus:ring-2 focus:ring-red-400 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReject}
              disabled={isPendingReject}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              <X size={13} aria-hidden="true" />
              {isPendingReject ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowRejectForm(false)
                setRejectionReason('')
              }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
