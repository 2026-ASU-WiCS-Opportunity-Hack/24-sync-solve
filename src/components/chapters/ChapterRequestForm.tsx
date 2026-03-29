'use client'

import { useActionState } from 'react'
import { Button, Input, Label, TextArea } from '@heroui/react'
import { requestNewChapterAction } from '@/features/chapters/actions/requestChapter'
import type { ActionResult, ChapterRequest } from '@/types'

export function ChapterRequestForm() {
  const [state, formAction, isPending] = useActionState<
    ActionResult<ChapterRequest> | null,
    FormData
  >(requestNewChapterAction, null)

  if (state?.success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="font-semibold text-green-800">Request submitted!</p>
        <p className="mt-1 text-sm text-green-700">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Chapter Name */}
      <div className="flex flex-col gap-1">
        <Label id="chapter-name-label" htmlFor="chapter-name" isRequired>
          Chapter Name
        </Label>
        <Input
          id="chapter-name"
          aria-labelledby="chapter-name-label"
          name="name"
          type="text"
          required
          maxLength={100}
          placeholder="e.g. WIAL Nigeria"
          aria-invalid={!!state?.fieldErrors?.['name'] || undefined}
        />
        {state?.fieldErrors?.['name'] && (
          <p className="text-xs text-red-600" role="alert">
            {state.fieldErrors['name'][0]}
          </p>
        )}
      </div>

      {/* URL Slug */}
      <div className="flex flex-col gap-1">
        <Label id="chapter-slug-label" htmlFor="chapter-slug" isRequired>
          URL Slug
        </Label>
        <p className="text-xs text-gray-500">
          Used in the URL, e.g. <span className="font-medium">nigeria</span> → wial.org/nigeria
        </p>
        <Input
          id="chapter-slug"
          aria-labelledby="chapter-slug-label"
          name="slug"
          type="text"
          required
          maxLength={30}
          placeholder="e.g. nigeria"
          pattern="[a-z0-9-]+"
          aria-invalid={!!state?.fieldErrors?.['slug'] || undefined}
        />
        {state?.fieldErrors?.['slug'] && (
          <p className="text-xs text-red-600" role="alert">
            {state.fieldErrors['slug'][0]}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {/* Country Code */}
        <div className="flex flex-col gap-1">
          <Label id="country-code-label" htmlFor="country-code" isRequired>
            Country Code
          </Label>
          <Input
            id="country-code"
            aria-labelledby="country-code-label"
            name="country_code"
            type="text"
            required
            maxLength={2}
            placeholder="NG"
            className="uppercase"
            aria-invalid={!!state?.fieldErrors?.['country_code'] || undefined}
          />
          {state?.fieldErrors?.['country_code'] && (
            <p className="text-xs text-red-600" role="alert">
              {state.fieldErrors['country_code'][0]}
            </p>
          )}
        </div>

        {/* Timezone */}
        <div className="flex flex-col gap-1">
          <Label id="timezone-label" htmlFor="timezone" isRequired>
            Timezone
          </Label>
          <Input
            id="timezone"
            aria-labelledby="timezone-label"
            name="timezone"
            type="text"
            required
            placeholder="Africa/Lagos"
            aria-invalid={!!state?.fieldErrors?.['timezone'] || undefined}
          />
          {state?.fieldErrors?.['timezone'] && (
            <p className="text-xs text-red-600" role="alert">
              {state.fieldErrors['timezone'][0]}
            </p>
          )}
        </div>

        {/* Currency */}
        <div className="flex flex-col gap-1">
          <Label id="currency-label" htmlFor="currency" isRequired>
            Currency
          </Label>
          <Input
            id="currency"
            aria-labelledby="currency-label"
            name="currency"
            type="text"
            required
            maxLength={3}
            placeholder="NGN"
            className="uppercase"
            aria-invalid={!!state?.fieldErrors?.['currency'] || undefined}
          />
          {state?.fieldErrors?.['currency'] && (
            <p className="text-xs text-red-600" role="alert">
              {state.fieldErrors['currency'][0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Contact Email */}
        <div className="flex flex-col gap-1">
          <Label id="contact-email-label" htmlFor="contact-email">
            Contact Email <span className="font-normal text-gray-400">(optional)</span>
          </Label>
          <Input
            id="contact-email"
            aria-labelledby="contact-email-label"
            name="contact_email"
            type="email"
            placeholder="chapter@wial.org"
          />
        </div>

        {/* Accent Color — no HeroUI color picker; keep native input */}
        <div>
          <label htmlFor="accent-color" className="block text-sm font-medium text-gray-700">
            Accent Color <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="accent-color"
            name="accent_color"
            type="color"
            defaultValue="#CC0000"
            className="mt-1 h-9.5 w-full cursor-pointer rounded-xl border border-gray-300 px-1 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <Label id="request-message-label" htmlFor="request-message">
          Message <span className="font-normal text-gray-400">(optional)</span>
        </Label>
        <TextArea
          id="request-message"
          aria-labelledby="request-message-label"
          name="message"
          rows={4}
          maxLength={2000}
          placeholder="Describe your proposed chapter, its region, and your plans…"
          className="mt-1 w-full"
        />
      </div>

      {/* Global error */}
      {state && !state.success && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
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
        {isPending ? 'Submitting…' : 'Submit Chapter Request'}
      </Button>
    </form>
  )
}
