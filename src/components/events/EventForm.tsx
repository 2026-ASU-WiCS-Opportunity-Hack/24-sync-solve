'use client'

import { useActionState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { TIMEZONES } from '@/lib/utils/constants'
import type { ActionResult, Event } from '@/types'

interface EventFormProps {
  /** Server action bound with chapterId */
  action: (
    prevState: ActionResult<Event> | null,
    formData: FormData
  ) => Promise<ActionResult<Event>>
  /** If editing, pre-filled event data */
  event?: Event
  /** Chapter accent color for submit button */
  accentColor?: string | null
}

/** Format a datetime-local input value from an ISO string */
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  // Trim seconds & timezone for datetime-local
  return iso.slice(0, 16)
}

export function EventForm({ action, event, accentColor }: EventFormProps) {
  const t = useTranslations('events.form')
  const tTypes = useTranslations('events.types')
  const [, startTransition] = useTransition()
  const [state, formAction, isPending] = useActionState<ActionResult<Event> | null, FormData>(
    action,
    null
  )

  const isEditing = !!event

  const EVENT_TYPES = [
    { value: 'workshop', label: tTypes('workshop') },
    { value: 'webinar', label: tTypes('webinar') },
    { value: 'conference', label: tTypes('conference') },
    { value: 'certification', label: tTypes('certification') },
    { value: 'networking', label: tTypes('networking') },
    { value: 'other', label: tTypes('other') },
  ] as const

  return (
    <form action={(fd) => startTransition(() => formAction(fd))} className="space-y-6" noValidate>
      {/* Hidden event id when editing */}
      {isEditing && <input type="hidden" name="id" value={event.id} />}

      {/* Error banner */}
      {state && !state.success && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="event-title" className="block text-sm font-medium text-gray-700">
          {t('titleLabel')} <span className="text-red-500">*</span>
        </label>
        <input
          id="event-title"
          name="title"
          type="text"
          required
          defaultValue={event?.title ?? ''}
          className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          placeholder={t('titlePlaceholder')}
        />
        {state && !state.success && state.fieldErrors?.['title'] && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors['title'][0]}</p>
        )}
      </div>

      {/* Event type */}
      <div>
        <label htmlFor="event-type" className="block text-sm font-medium text-gray-700">
          {t('typeLabel')} <span className="text-red-500">*</span>
        </label>
        <select
          id="event-type"
          name="event_type"
          required
          defaultValue={event?.event_type ?? 'workshop'}
          className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        >
          {EVENT_TYPES.map((eventType) => (
            <option key={eventType.value} value={eventType.value}>
              {eventType.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="event-description" className="block text-sm font-medium text-gray-700">
          {t('descriptionLabel')}
        </label>
        <textarea
          id="event-description"
          name="description"
          rows={4}
          defaultValue={event?.description ?? ''}
          className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          placeholder={t('descriptionPlaceholder')}
        />
      </div>

      {/* Date & time */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="event-start" className="block text-sm font-medium text-gray-700">
            {t('startDateLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            id="event-start"
            name="start_date"
            type="datetime-local"
            required
            defaultValue={toDatetimeLocal(event?.start_date)}
            className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          />
          {state && !state.success && state.fieldErrors?.['start_date'] && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors['start_date'][0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="event-end" className="block text-sm font-medium text-gray-700">
            {t('endDateLabel')}
          </label>
          <input
            id="event-end"
            name="end_date"
            type="datetime-local"
            defaultValue={toDatetimeLocal(event?.end_date)}
            className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          />
          {state && !state.success && state.fieldErrors?.['end_date'] && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors['end_date'][0]}</p>
          )}
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label htmlFor="event-timezone" className="block text-sm font-medium text-gray-700">
          {t('timezoneLabel')} <span className="text-red-500">*</span>
        </label>
        <input
          id="event-timezone"
          name="timezone"
          type="text"
          required
          defaultValue={event?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
          list="timezone-list"
          className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          placeholder={t('timezonePlaceholder')}
        />
        <datalist id="timezone-list">
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz} />
          ))}
        </datalist>
      </div>

      {/* Virtual / In-person */}
      <div className="flex items-start gap-3">
        <input
          id="event-virtual"
          name="is_virtual"
          type="checkbox"
          defaultChecked={event?.is_virtual ?? false}
          value="true"
          onChange={(e) => {
            const hiddenInput = e.currentTarget.form?.elements.namedItem(
              'is_virtual_hidden'
            ) as HTMLInputElement | null
            if (hiddenInput) hiddenInput.value = e.currentTarget.checked ? 'true' : 'false'
          }}
          className="accent-wial-navy mt-0.5 h-4 w-4"
        />
        <input
          type="hidden"
          name="is_virtual"
          value={event?.is_virtual ? 'true' : 'false'}
          id="is_virtual_hidden"
        />
        <label htmlFor="event-virtual" className="text-sm font-medium text-gray-700">
          {t('isVirtualLabel')}
        </label>
      </div>

      {/* Location / Virtual link */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="event-location" className="block text-sm font-medium text-gray-700">
            {t('locationNameLabel')}
          </label>
          <input
            id="event-location"
            name="location_name"
            type="text"
            defaultValue={event?.location_name ?? ''}
            className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            placeholder={t('locationNamePlaceholder')}
          />
        </div>
        <div>
          <label htmlFor="event-virtual-link" className="block text-sm font-medium text-gray-700">
            {t('virtualLinkLabel')}
          </label>
          <input
            id="event-virtual-link"
            name="virtual_link"
            type="url"
            defaultValue={event?.virtual_link ?? ''}
            className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            placeholder={t('virtualLinkPlaceholder')}
          />
          {state && !state.success && state.fieldErrors?.['virtual_link'] && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors['virtual_link'][0]}</p>
          )}
        </div>
      </div>

      {/* Ticket price */}
      <div>
        <label htmlFor="event-ticket-price" className="block text-sm font-medium text-gray-700">
          {t('ticketPriceLabel')}
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute inset-y-0 inset-s-3 flex items-center text-sm text-gray-500">
            $
          </span>
          <input
            id="event-ticket-price"
            name="ticket_price_usd"
            type="number"
            min="0"
            step="0.01"
            defaultValue={
              (event as Event & { ticket_price?: number | null })?.ticket_price != null
                ? ((event as Event & { ticket_price?: number | null }).ticket_price! / 100).toFixed(
                    2
                  )
                : ''
            }
            className="focus:border-wial-navy focus:ring-wial-navy/20 w-full rounded-lg border border-gray-300 py-2 ps-8 pe-3 text-sm focus:ring-2 focus:outline-none"
            placeholder={t('ticketPricePlaceholder')}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">{t('ticketPriceHint')}</p>
        {state && !state.success && state.fieldErrors?.['ticket_price_usd'] && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors['ticket_price_usd'][0]}</p>
        )}
      </div>

      {/* Registration & attendees */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="event-registration-url"
            className="block text-sm font-medium text-gray-700"
          >
            {t('registrationUrlLabel')}
          </label>
          <input
            id="event-registration-url"
            name="registration_url"
            type="url"
            defaultValue={event?.registration_url ?? ''}
            className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            placeholder={t('registrationUrlPlaceholder')}
          />
          <p className="mt-1 text-xs text-gray-500">{t('registrationUrlHint')}</p>
          {state && !state.success && state.fieldErrors?.['registration_url'] && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors['registration_url'][0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="event-max-attendees" className="block text-sm font-medium text-gray-700">
            {t('maxAttendeesLabel')}
          </label>
          <input
            id="event-max-attendees"
            name="max_attendees"
            type="number"
            min="1"
            defaultValue={event?.max_attendees ?? ''}
            className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            placeholder={t('maxAttendeesPlaceholder')}
          />
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label htmlFor="event-image-url" className="block text-sm font-medium text-gray-700">
          {t('imageUrlLabel')}
        </label>
        <input
          id="event-image-url"
          name="image_url"
          type="url"
          defaultValue={event?.image_url ?? ''}
          className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          placeholder={t('imageUrlPlaceholder')}
        />
      </div>

      {/* Published toggle */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <input
          id="event-published"
          name="is_published"
          type="checkbox"
          defaultChecked={event?.is_published ?? false}
          value="true"
          className="accent-wial-navy h-4 w-4"
        />
        <label htmlFor="event-published" className="text-sm font-medium text-gray-700">
          {t('isPublishedLabel')}
        </label>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isPending}
          style={accentColor ? { backgroundColor: accentColor } : undefined}
          className="bg-wial-navy hover:bg-wial-navy-light inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
          {isPending ? t('saving') : isEditing ? t('saveButton') : t('createButton')}
        </button>
      </div>
    </form>
  )
}
