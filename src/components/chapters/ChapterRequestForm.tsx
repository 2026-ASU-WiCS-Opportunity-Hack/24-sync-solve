'use client'

import { useActionState } from 'react'
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
      <div>
        <label htmlFor="chapter-name" className="block text-sm font-medium text-gray-700">
          Chapter Name{' '}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="chapter-name"
          name="name"
          type="text"
          required
          maxLength={100}
          placeholder="e.g. WIAL Nigeria"
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        {state?.fieldErrors?.['name'] && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {state.fieldErrors['name'][0]}
          </p>
        )}
      </div>

      {/* URL Slug */}
      <div>
        <label htmlFor="chapter-slug" className="block text-sm font-medium text-gray-700">
          URL Slug{' '}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        </label>
        <p className="mt-0.5 text-xs text-gray-500">
          Used in the URL, e.g. <span className="font-medium">nigeria</span> → wial.org/nigeria
        </p>
        <input
          id="chapter-slug"
          name="slug"
          type="text"
          required
          maxLength={30}
          placeholder="e.g. nigeria"
          pattern="[a-z0-9-]+"
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        {state?.fieldErrors?.['slug'] && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {state.fieldErrors['slug'][0]}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {/* Country Code */}
        <div>
          <label htmlFor="country-code" className="block text-sm font-medium text-gray-700">
            Country Code{' '}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="country-code"
            name="country_code"
            type="text"
            required
            maxLength={2}
            minLength={2}
            placeholder="NG"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {state?.fieldErrors?.['country_code'] && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {state.fieldErrors['country_code'][0]}
            </p>
          )}
        </div>

        {/* Timezone */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
            Timezone{' '}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="timezone"
            name="timezone"
            type="text"
            required
            placeholder="Africa/Lagos"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {state?.fieldErrors?.['timezone'] && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {state.fieldErrors['timezone'][0]}
            </p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
            Currency{' '}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="currency"
            name="currency"
            type="text"
            required
            maxLength={3}
            minLength={3}
            placeholder="NGN"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {state?.fieldErrors?.['currency'] && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {state.fieldErrors['currency'][0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Contact Email */}
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">
            Contact Email <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="contact-email"
            name="contact_email"
            type="email"
            placeholder="chapter@wial.org"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Accent Color */}
        <div>
          <label htmlFor="accent-color" className="block text-sm font-medium text-gray-700">
            Accent Color <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="accent-color"
            name="accent_color"
            type="color"
            defaultValue="#CC0000"
            className="mt-1 h-[38px] w-full cursor-pointer rounded-xl border border-gray-300 px-1 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="request-message" className="block text-sm font-medium text-gray-700">
          Message <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="request-message"
          name="message"
          rows={4}
          maxLength={2000}
          placeholder="Describe your proposed chapter, its region, and your plans…"
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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

      <button
        type="submit"
        disabled={isPending}
        className="bg-wial-navy hover:bg-wial-navy-dark w-full rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
      >
        {isPending ? 'Submitting…' : 'Submit Chapter Request'}
      </button>
    </form>
  )
}
