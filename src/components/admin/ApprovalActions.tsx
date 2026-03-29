'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { Button, TextArea } from '@heroui/react'
import { approveBlock, rejectBlock } from '@/features/content/actions/contentApproval'

interface ApprovalActionsProps {
  blockId: string
}

export function ApprovalActions({ blockId }: ApprovalActionsProps) {
  const router = useRouter()
  const [isPendingApprove, startApprove] = useTransition()
  const [isPendingReject, startReject] = useTransition()
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  function handleApprove() {
    startApprove(async () => {
      const result = await approveBlock(blockId)
      if (!result.success) {
        toast.error(result.error ?? 'Approval failed.')
      } else {
        toast.success(result.message ?? 'Content approved and published.')
        router.refresh()
      }
    })
  }

  function handleReject() {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection.')
      return
    }
    startReject(async () => {
      const result = await rejectBlock(blockId, rejectionReason)
      if (!result.success) {
        toast.error(result.error ?? 'Rejection failed.')
      } else {
        toast.success(result.message ?? 'Content rejected.')
        setShowRejectForm(false)
        setRejectionReason('')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      {!showRejectForm ? (
        <div className="flex gap-2">
          <Button
            type="button"
            onPress={handleApprove}
            isDisabled={isPendingApprove || isPendingReject}
            isPending={isPendingApprove}
            size="sm"
            variant="primary"
            className="rounded-lg text-xs font-semibold text-white"
          >
            {isPendingApprove ? (
              'Approving…'
            ) : (
              <>
                <Check size={13} aria-hidden="true" />
                Approve &amp; Publish
              </>
            )}
          </Button>
          <Button
            type="button"
            onPress={() => setShowRejectForm(true)}
            isDisabled={isPendingApprove}
            size="sm"
            variant="danger"
            className="rounded-lg text-xs font-semibold"
          >
            <X size={13} aria-hidden="true" />
            Reject
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <label
              htmlFor={`reason-${blockId}`}
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Reason for rejection{' '}
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <TextArea
              id={`reason-${blockId}`}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
              rows={2}
              placeholder="Explain why this content was rejected…"
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onPress={handleReject}
              isDisabled={isPendingReject}
              isPending={isPendingReject}
              size="sm"
              variant="danger"
              className="rounded-lg text-xs font-semibold text-white"
            >
              {isPendingReject ? (
                'Rejecting…'
              ) : (
                <>
                  <X size={13} aria-hidden="true" />
                  Confirm Rejection
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onPress={() => {
                setShowRejectForm(false)
                setRejectionReason('')
              }}
              className="rounded-lg text-xs font-semibold text-gray-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
