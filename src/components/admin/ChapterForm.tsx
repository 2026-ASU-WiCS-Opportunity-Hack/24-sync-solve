'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button, Checkbox, Input, Label, ListBox, ListBoxItem, Select } from '@heroui/react'
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
      {isEdit && <input type="hidden" name="id" value={chapter.id} />}

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
        <div className="flex flex-col gap-1">
          <Label id="name-label" htmlFor="name" isRequired>
            {t('fields.name')}
          </Label>
          <Input
            id="name"
            aria-labelledby="name-label"
            name="name"
            type="text"
            required
            defaultValue={chapter?.name}
            placeholder="WIAL USA"
            aria-invalid={!!fieldError('name') || undefined}
          />
          {fieldError('name') && (
            <p className="text-xs text-red-600" role="alert">
              {fieldError('name')}
            </p>
          )}
        </div>

        {/* Slug */}
        <div className="flex flex-col gap-1">
          <Label id="slug-label" htmlFor="slug" isRequired>
            {t('fields.slug')}
          </Label>
          <p className="text-xs text-gray-500">{t('fields.slugHint')}</p>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute inset-s-3 text-sm text-gray-400">/</span>
            <Input
              id="slug"
              aria-labelledby="slug-label"
              name="slug"
              type="text"
              required
              defaultValue={chapter?.slug}
              placeholder="usa"
              pattern="[a-z0-9-]+"
              className="ps-6"
              aria-invalid={!!fieldError('slug') || undefined}
            />
          </div>
          {fieldError('slug') && (
            <p className="text-xs text-red-600" role="alert">
              {fieldError('slug')}
            </p>
          )}
        </div>

        {/* Country code */}
        <div className="flex flex-col gap-1">
          <Label id="country_code-label" htmlFor="country_code" isRequired>
            {t('fields.countryCode')}
          </Label>
          <p className="text-xs text-gray-500">{t('fields.countryCodeHint')}</p>
          <Input
            id="country_code"
            aria-labelledby="country_code-label"
            name="country_code"
            type="text"
            required
            maxLength={2}
            defaultValue={chapter?.country_code}
            placeholder="US"
            className="uppercase"
            aria-invalid={!!fieldError('country_code') || undefined}
          />
          {fieldError('country_code') && (
            <p className="text-xs text-red-600" role="alert">
              {fieldError('country_code')}
            </p>
          )}
        </div>

        {/* Timezone */}
        <div className="flex flex-col gap-1">
          <Label id="timezone-label" htmlFor="timezone-trigger" isRequired>
            {t('fields.timezone')}
          </Label>
          <Select name="timezone" isRequired aria-labelledby="timezone-label">
            <Select.Trigger id="timezone-trigger">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox aria-label={t('fields.timezone')}>
                {TIMEZONES.map((tz) => (
                  <ListBoxItem key={tz} id={tz}>
                    {tz}
                  </ListBoxItem>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          {fieldError('timezone') && (
            <p className="text-xs text-red-600" role="alert">
              {fieldError('timezone')}
            </p>
          )}
        </div>

        {/* Currency */}
        <div className="flex flex-col gap-1">
          <Label id="currency-label" htmlFor="currency-trigger" isRequired>
            {t('fields.currency')}
          </Label>
          <Select name="currency" isRequired aria-labelledby="currency-label">
            <Select.Trigger id="currency-trigger">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox aria-label={t('fields.currency')}>
                {CURRENCIES.map(({ code, label }) => (
                  <ListBoxItem key={code} id={code}>
                    {label}
                  </ListBoxItem>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          {fieldError('currency') && (
            <p className="text-xs text-red-600" role="alert">
              {fieldError('currency')}
            </p>
          )}
        </div>

        {/* Accent color — no HeroUI color picker; keep native input */}
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
        <div className="flex flex-col gap-1">
          <Label id="contact_email-label" htmlFor="contact_email">
            {t('fields.contactEmail')}
          </Label>
          <Input
            id="contact_email"
            aria-labelledby="contact_email-label"
            name="contact_email"
            type="email"
            defaultValue={chapter?.contact_email ?? ''}
            placeholder="usa@wial.edu"
            aria-invalid={!!fieldError('contact_email') || undefined}
          />
          {fieldError('contact_email') && (
            <p className="text-xs text-red-600" role="alert">
              {fieldError('contact_email')}
            </p>
          )}
        </div>

        {/* Website URL */}
        <div className="flex flex-col gap-1">
          <Label id="website_url-label" htmlFor="website_url">
            {t('fields.websiteUrl')}
          </Label>
          <Input
            id="website_url"
            aria-labelledby="website_url-label"
            name="website_url"
            type="url"
            defaultValue={chapter?.website_url ?? ''}
            placeholder="https://usa.wial.edu"
            aria-invalid={!!fieldError('website_url') || undefined}
          />
          {fieldError('website_url') && (
            <p className="text-xs text-red-600" role="alert">
              {fieldError('website_url')}
            </p>
          )}
        </div>

        {/* is_active — edit mode only */}
        {isEdit && (
          <div className="sm:col-span-2">
            <Checkbox
              id="is_active"
              name="is_active"
              value="true"
              defaultSelected={chapter.is_active ?? true}
            >
              {t('fields.isActiveLabel')}
            </Checkbox>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3 border-t border-gray-200 pt-6">
        <Button
          type="submit"
          isDisabled={isPending}
          isPending={isPending}
          className="bg-wial-navy hover:bg-wial-navy-dark rounded-lg px-5 text-sm font-semibold text-white"
        >
          {isPending
            ? isEdit
              ? t('form.saving')
              : t('form.creating')
            : isEdit
              ? t('form.saveButton')
              : t('form.createButton')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onPress={() => router.back()}
          className="rounded-lg px-5 text-sm font-semibold text-gray-700"
        >
          {t('form.cancel')}
        </Button>
      </div>
    </form>
  )
}
