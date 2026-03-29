'use client'

import { useActionState } from 'react'
import { Button, Input, Label, ListBox, ListBoxItem, Select, TextArea } from '@heroui/react'
import { applyForCoachAction } from '@/features/coaches/actions/coachApplication'
import type { ActionResult, CoachApplication } from '@/types'

interface Chapter {
  id: string
  name: string
  slug: string
}

interface CoachApplyFormProps {
  chapters: Chapter[]
}

export function CoachApplyForm({ chapters }: CoachApplyFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionResult<CoachApplication> | null,
    FormData
  >(applyForCoachAction, null)

  if (state?.success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="font-semibold text-green-800">Application submitted!</p>
        <p className="mt-1 text-sm text-green-700">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Chapter */}
      <div>
        <label
          id="chapter_id-label"
          htmlFor="chapter_id-trigger"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Chapter{' '}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        </label>
        <Select name="chapter_id" isRequired className="w-full" aria-labelledby="chapter_id-label">
          <Select.Trigger id="chapter_id-trigger">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox aria-label="Select a chapter">
              {chapters.map((ch) => (
                <ListBoxItem key={ch.id} id={ch.id} textValue={ch.name}>
                  {ch.name}
                </ListBoxItem>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        {state?.fieldErrors?.['chapter_id'] && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {state.fieldErrors['chapter_id'][0]}
          </p>
        )}
      </div>

      {/* Credly URL */}
      <div className="flex flex-col gap-1">
        <Label id="credly_url-label" htmlFor="credly_url" isRequired>
          Credly Badge URL
        </Label>
        <p className="text-xs text-gray-500">
          Your Credly badge URL from <span className="font-medium">credly.com/badges/…</span>
        </p>
        <Input
          id="credly_url"
          aria-labelledby="credly_url-label"
          name="credly_url"
          type="url"
          required
          placeholder="https://www.credly.com/badges/…"
          aria-invalid={!!state?.fieldErrors?.['credly_url'] || undefined}
        />
        {state?.fieldErrors?.['credly_url'] && (
          <p className="text-xs text-red-600" role="alert">
            {state.fieldErrors['credly_url'][0]}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          id="message-label"
          htmlFor="message"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Message <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <TextArea
          id="message"
          aria-labelledby="message-label"
          name="message"
          rows={4}
          maxLength={2000}
          placeholder="Tell us about your Action Learning coaching experience…"
          className="w-full"
        />
      </div>

      {/* Global error */}
      {state && !state.success && !state.fieldErrors && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      )}
      {state && !state.success && state.fieldErrors && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        isDisabled={isPending}
        isPending={isPending}
        fullWidth
        className="bg-wial-navy hover:bg-wial-navy-dark rounded-xl text-sm font-semibold text-white"
      >
        {isPending ? 'Submitting…' : 'Submit Application'}
      </Button>
    </form>
  )
}
