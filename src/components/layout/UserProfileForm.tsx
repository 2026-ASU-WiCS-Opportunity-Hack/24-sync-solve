'use client'

import { useActionState, useTransition, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button, Input, Label } from '@heroui/react'
import { ImageUpload } from '@/components/editor/ImageUpload'
import { updateUserProfileAction } from '@/features/auth/actions/updateUserProfile'
import type { ActionResult } from '@/types'

interface UserProfileFormProps {
  fullName: string | null
  email: string
  avatarUrl: string | null
}

export function UserProfileForm({ fullName, email, avatarUrl }: UserProfileFormProps) {
  const [, startTransition] = useTransition()
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>(avatarUrl ?? '')

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateUserProfileAction,
    null
  )

  if (state?.success && state.message) {
    toast.success(state.message)
  }

  const displayName = fullName ?? email

  return (
    <form
      action={(formData) => {
        formData.set('avatar_url', currentAvatarUrl)
        startTransition(() => formAction(formData))
      }}
      className="space-y-6"
      noValidate
    >
      {state && !state.success && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.error}
        </div>
      )}

      {/* Avatar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-900">Profile Photo</h2>
        <p className="mb-4 text-xs text-gray-500">
          Your avatar appears in the navigation and dashboards.
        </p>

        <div className="flex items-center gap-6">
          {/* Current preview */}
          <div className="shrink-0">
            {currentAvatarUrl ? (
              <div className="relative size-[72px] overflow-hidden rounded-full ring-2 ring-gray-200">
                <Image
                  src={currentAvatarUrl}
                  alt={`${displayName}'s avatar`}
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="bg-wial-navy flex size-[72px] items-center justify-center rounded-full text-2xl font-bold text-white">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="max-w-xs min-w-0 flex-1">
            <ImageUpload
              value={currentAvatarUrl}
              onChange={setCurrentAvatarUrl}
              bucket="avatars"
              pathPrefix="profiles"
              previewAlt="Profile avatar"
              label="Upload profile photo"
            />
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Personal Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              defaultValue={fullName ?? ''}
              placeholder="Your full name"
              maxLength={200}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="email_display">Email</Label>
            <Input
              id="email_display"
              type="email"
              value={email}
              disabled
              aria-describedby="email-hint"
            />
            <p id="email-hint" className="text-xs text-gray-400">
              Email cannot be changed here.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          isDisabled={isPending}
          isPending={isPending}
          className="bg-wial-navy hover:bg-wial-navy-light rounded-xl px-6 text-sm font-semibold text-white shadow-sm"
        >
          {isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
