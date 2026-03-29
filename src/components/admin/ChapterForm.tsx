'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { createChapterAction } from '@/features/chapters/actions/createChapter'
import { updateChapterAction } from '@/features/chapters/actions/updateChapter'
import { TIMEZONES } from '@/lib/utils/constants'
import type { ActionResult, Chapter } from '@/types'

const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'NGN', label: 'NGN — Nigerian Naira' },
  { code: 'BRL', label: 'BRL — Brazilian Real' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'ZAR', label: 'ZAR — South African Rand' },
  { code: 'KES', label: 'KES — Kenyan Shilling' },
  { code: 'INR', label: 'INR — Indian Rupee' },
] as const

interface ChapterFormProps {
  /** Pass existing chapter to pre-fill the edit form */
  chapter?: Chapter
}

const initialState: ActionResult<Chapter> | null = null

export function ChapterForm({ chapter }: ChapterFormProps) {
  const isEdit = !!chapter
  const action = isEdit ? updateChapterAction : createChapterAction
  const router = useRouter()
  const t = useTranslations('admin.chapters')

  const [state, formAction, isPending] = useActionState<ActionResult<Chapter> | null, FormData>(
    action,
    initialState
  )

  // Show toast and redirect on success
  useEffect(() => {
    if (state?.success) {
      toast.success(state.message ?? (isEdit ? t('form.saveButton') : t('form.createButton')))
      router.push('/admin/chapters')
    }
  }, [state, isEdit, router, t])

  function fieldError(field: string): string | undefined {
    if (!state || state.success) return undefined
    return state.fieldErrors?.[field]?.[0]
  }

  return (
    <form
      action={formAction}
      className="space-y-6"
      aria-label={isEdit ? t('form.ariaEdit') : t('form.ariaCreate')}
    >
      {/* Hidden id for edit */}
      {isEdit && <input type="hidden" name="id" value={chapter.id} />}

      {/* Global error */}
      {state && !state.success && !state.fieldErrors && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Chapter name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            {t('fields.name')}{' '}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={chapter?.name}
            placeholder="WIAL USA"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-describedby={fieldError('name') ? 'name-error' : undefined}
          />
          {fieldError('name') && (
            <p id="name-error" role="alert" className="mt-1 text-xs text-red-600">
              {fieldError('name')}
            </p>
          )}
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
            {t('fields.slug')}{' '}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 inset-s-0 flex items-center ps-3 text-sm text-gray-400">
              /
            </span>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              defaultValue={chapter?.slug}
              placeholder="usa"
              pattern="[a-z0-9-]+"
              className="block w-full rounded-lg border border-gray-300 py-2 ps-6 pe-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-describedby={fieldError('slug') ? 'slug-error' : 'slug-hint'}
            />
          </div>
          <p id="slug-hint" className="mt-1 text-xs text-gray-500">
            {t('fields.slugHint')}
          </p>
          {fieldError('slug') && (
            <p id="slug-error" role="alert" className="mt-1 text-xs text-red-600">
              {fieldError('slug')}
            </p>
          )}
        </div>

        {/* Country code */}
        <div>
          <label htmlFor="country_code" className="block text-sm font-medium text-gray-700">
            {t('fields.countryCode')}{' '}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="country_code"
            name="country_code"
            type="text"
            required
            maxLength={2}
            defaultValue={chapter?.country_code}
            placeholder="US"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-describedby={fieldError('country_code') ? 'country-error' : 'country-hint'}
          />
          <p id="country-hint" className="mt-1 text-xs text-gray-500">
            {t('fields.countryCodeHint')}
          </p>
          {fieldError('country_code') && (
            <p id="country-error" role="alert" className="mt-1 text-xs text-red-600">
              {fieldError('country_code')}
            </p>
          )}
        </div>

        {/* Timezone */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
            {t('fields.timezone')}{' '}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <select
            id="timezone"
            name="timezone"
            required
            defaultValue={chapter?.timezone ?? 'America/New_York'}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Currency */}
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
            {t('fields.currency')}{' '}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <select
            id="currency"
            name="currency"
            required
            defaultValue={chapter?.currency ?? 'USD'}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {CURRENCIES.map(({ code, label }) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Accent color */}
        <div>
          <label htmlFor="accent_color" className="block text-sm font-medium text-gray-700">
            {t('fields.accentColor')}{' '}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="accent_color"
              name="accent_color"
              type="color"
              required
              defaultValue={chapter?.accent_color ?? '#CC0000'}
              className="h-9 w-16 cursor-pointer rounded-lg border border-gray-300 p-0.5"
              aria-label={t('fields.accentColorPickerLabel')}
            />
            <input
              type="text"
              readOnly
              aria-hidden="true"
              tabIndex={-1}
              value={chapter?.accent_color ?? '#CC0000'}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500"
              placeholder="#CC0000"
            />
          </div>
          {fieldError('accent_color') && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {fieldError('accent_color')}
            </p>
          )}
        </div>

        {/* Contact email */}
        <div>
          <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700">
            {t('fields.contactEmail')}
          </label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={chapter?.contact_email ?? ''}
            placeholder="usa@wial.edu"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-describedby={fieldError('contact_email') ? 'email-error' : undefined}
          />
          {fieldError('contact_email') && (
            <p id="email-error" role="alert" className="mt-1 text-xs text-red-600">
              {fieldError('contact_email')}
            </p>
          )}
        </div>

        {/* Website URL */}
        <div>
          <label htmlFor="website_url" className="block text-sm font-medium text-gray-700">
            {t('fields.websiteUrl')}
          </label>
          <input
            id="website_url"
            name="website_url"
            type="url"
            defaultValue={chapter?.website_url ?? ''}
            placeholder="https://usa.wial.edu"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-describedby={fieldError('website_url') ? 'website-error' : undefined}
          />
          {fieldError('website_url') && (
            <p id="website-error" role="alert" className="mt-1 text-xs text-red-600">
              {fieldError('website_url')}
            </p>
          )}
        </div>

        {/* is_active — edit mode only */}
        {isEdit && (
          <div className="sm:col-span-2">
            <div className="flex items-center gap-3">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                defaultChecked={chapter.is_active ?? true}
                value="true"
                className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                {t('fields.isActiveLabel')}
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3 border-t border-gray-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="bg-wial-navy hover:bg-wial-navy-dark rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
        >
          {isPending
            ? isEdit
              ? t('form.saving')
              : t('form.creating')
            : isEdit
              ? t('form.saveButton')
              : t('form.createButton')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          {t('form.cancel')}
        </button>
      </div>
    </form>
  )
}
