'use client'

import { useActionState, useTransition, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Button,
  Checkbox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  TextArea,
} from '@heroui/react'
import { TIMEZONES } from '@/lib/utils/constants'
import type { ActionResult, Event } from '@/types'

interface EventFormProps {
  action: (
    prevState: ActionResult<Event> | null,
    formData: FormData
  ) => Promise<ActionResult<Event>>
  event?: Event
  accentColor?: string | null
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.slice(0, 16)
}

export function EventForm({ action, event, accentColor }: EventFormProps) {
  const t = useTranslations('events.form')
  const tTypes = useTranslations('events.types')
  const [, startTransition] = useTransition()
  const [isVirtual, setIsVirtual] = useState(event?.is_virtual ?? false)
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
      {isEditing && <input type="hidden" name="id" value={event.id} />}

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
      <div className="flex flex-col gap-1">
        <Label id="event-title-label" htmlFor="event-title" isRequired>
          {t('titleLabel')}
        </Label>
        <Input
          id="event-title"
          aria-labelledby="event-title-label"
          name="title"
          type="text"
          required
          defaultValue={event?.title ?? ''}
          placeholder={t('titlePlaceholder')}
          aria-invalid={!!(state && !state.success && state.fieldErrors?.['title']) || undefined}
        />
        {state && !state.success && state.fieldErrors?.['title'] && (
          <p className="text-xs text-red-600" role="alert">
            {state.fieldErrors['title'][0]}
          </p>
        )}
      </div>

      {/* Event type */}
      <div className="flex flex-col gap-1">
        <Label id="event-type-label" htmlFor="event-type-trigger" isRequired>
          {t('typeLabel')}
        </Label>
        <Select name="event_type" isRequired aria-labelledby="event-type-label">
          <Select.Trigger id="event-type-trigger">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox aria-label={t('typeLabel')}>
              {EVENT_TYPES.map((eventType) => (
                <ListBoxItem key={eventType.value} id={eventType.value} textValue={eventType.label}>
                  {eventType.label}
                </ListBoxItem>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <Label id="event-description-label" htmlFor="event-description">
          {t('descriptionLabel')}
        </Label>
        <TextArea
          id="event-description"
          aria-labelledby="event-description-label"
          name="description"
          rows={4}
          defaultValue={event?.description ?? ''}
          placeholder={t('descriptionPlaceholder')}
          className="w-full"
        />
      </div>

      {/* Date & time */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label id="event-start-label" htmlFor="event-start" isRequired>
            {t('startDateLabel')}
          </Label>
          <Input
            id="event-start"
            aria-labelledby="event-start-label"
            name="start_date"
            type="datetime-local"
            required
            defaultValue={toDatetimeLocal(event?.start_date)}
            aria-invalid={
              !!(state && !state.success && state.fieldErrors?.['start_date']) || undefined
            }
          />
          {state && !state.success && state.fieldErrors?.['start_date'] && (
            <p className="text-xs text-red-600" role="alert">
              {state.fieldErrors['start_date'][0]}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Label id="event-end-label" htmlFor="event-end">
            {t('endDateLabel')}
          </Label>
          <Input
            id="event-end"
            aria-labelledby="event-end-label"
            name="end_date"
            type="datetime-local"
            defaultValue={toDatetimeLocal(event?.end_date)}
            aria-invalid={
              !!(state && !state.success && state.fieldErrors?.['end_date']) || undefined
            }
          />
          {state && !state.success && state.fieldErrors?.['end_date'] && (
            <p className="text-xs text-red-600" role="alert">
              {state.fieldErrors['end_date'][0]}
            </p>
          )}
        </div>
      </div>

      {/* Timezone */}
      <div className="flex flex-col gap-1">
        <Label id="event-timezone-label" htmlFor="event-timezone" isRequired>
          {t('timezoneLabel')}
        </Label>
        <Input
          id="event-timezone"
          aria-labelledby="event-timezone-label"
          name="timezone"
          type="text"
          required
          defaultValue={event?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
          list="timezone-list"
          placeholder={t('timezonePlaceholder')}
        />
        <datalist id="timezone-list">
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz} />
          ))}
        </datalist>
      </div>

      {/* Virtual / In-person */}
      <div>
        <input type="hidden" name="is_virtual" value={isVirtual ? 'true' : 'false'} readOnly />
        <Checkbox
          id="event-virtual"
          isSelected={isVirtual}
          onChange={(checked: boolean) => setIsVirtual(checked)}
        >
          {t('isVirtualLabel')}
        </Checkbox>
      </div>

      {/* Location / Virtual link */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label id="event-location-label" htmlFor="event-location">
            {t('locationNameLabel')}
          </Label>
          <Input
            id="event-location"
            aria-labelledby="event-location-label"
            name="location_name"
            type="text"
            defaultValue={event?.location_name ?? ''}
            placeholder={t('locationNamePlaceholder')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label id="event-virtual-link-label" htmlFor="event-virtual-link">
            {t('virtualLinkLabel')}
          </Label>
          <Input
            id="event-virtual-link"
            aria-labelledby="event-virtual-link-label"
            name="virtual_link"
            type="url"
            defaultValue={event?.virtual_link ?? ''}
            placeholder={t('virtualLinkPlaceholder')}
            aria-invalid={
              !!(state && !state.success && state.fieldErrors?.['virtual_link']) || undefined
            }
          />
          {state && !state.success && state.fieldErrors?.['virtual_link'] && (
            <p className="text-xs text-red-600" role="alert">
              {state.fieldErrors['virtual_link'][0]}
            </p>
          )}
        </div>
      </div>

      {/* Ticket price */}
      <div className="flex flex-col gap-1">
        <Label id="event-ticket-price-label" htmlFor="event-ticket-price">
          {t('ticketPriceLabel')}
        </Label>
        <p className="text-xs text-gray-500">{t('ticketPriceHint')}</p>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute inset-s-3 text-sm text-gray-500">$</span>
          <Input
            id="event-ticket-price"
            aria-labelledby="event-ticket-price-label"
            name="ticket_price_usd"
            type="number"
            min={0}
            step={0.01}
            defaultValue={
              (event as Event & { ticket_price?: number | null })?.ticket_price != null
                ? String(
                    (
                      (event as Event & { ticket_price?: number | null }).ticket_price! / 100
                    ).toFixed(2)
                  )
                : ''
            }
            placeholder={t('ticketPricePlaceholder')}
            className="ps-6"
            aria-invalid={
              !!(state && !state.success && state.fieldErrors?.['ticket_price_usd']) || undefined
            }
          />
        </div>
        {state && !state.success && state.fieldErrors?.['ticket_price_usd'] && (
          <p className="text-xs text-red-600" role="alert">
            {state.fieldErrors['ticket_price_usd'][0]}
          </p>
        )}
      </div>

      {/* Registration & attendees */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label id="event-registration-url-label" htmlFor="event-registration-url">
            {t('registrationUrlLabel')}
          </Label>
          <p className="text-xs text-gray-500">{t('registrationUrlHint')}</p>
          <Input
            id="event-registration-url"
            aria-labelledby="event-registration-url-label"
            name="registration_url"
            type="url"
            defaultValue={event?.registration_url ?? ''}
            placeholder={t('registrationUrlPlaceholder')}
            aria-invalid={
              !!(state && !state.success && state.fieldErrors?.['registration_url']) || undefined
            }
          />
          {state && !state.success && state.fieldErrors?.['registration_url'] && (
            <p className="text-xs text-red-600" role="alert">
              {state.fieldErrors['registration_url'][0]}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Label id="event-max-attendees-label" htmlFor="event-max-attendees">
            {t('maxAttendeesLabel')}
          </Label>
          <Input
            id="event-max-attendees"
            aria-labelledby="event-max-attendees-label"
            name="max_attendees"
            type="number"
            min={1}
            defaultValue={event?.max_attendees != null ? String(event.max_attendees) : ''}
            placeholder={t('maxAttendeesPlaceholder')}
          />
        </div>
      </div>

      {/* Image URL */}
      <div className="flex flex-col gap-1">
        <Label id="event-image-url-label" htmlFor="event-image-url">
          {t('imageUrlLabel')}
        </Label>
        <Input
          id="event-image-url"
          aria-labelledby="event-image-url-label"
          name="image_url"
          type="url"
          defaultValue={event?.image_url ?? ''}
          placeholder={t('imageUrlPlaceholder')}
        />
      </div>

      {/* Published toggle */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <Checkbox
          id="event-published"
          name="is_published"
          value="true"
          defaultSelected={event?.is_published ?? false}
        >
          {t('isPublishedLabel')}
        </Checkbox>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          isDisabled={isPending}
          isPending={isPending}
          style={accentColor ? { backgroundColor: accentColor } : undefined}
          className="bg-wial-navy hover:bg-wial-navy-light rounded-xl px-6 text-sm font-semibold text-white shadow-sm"
        >
          {isPending ? t('saving') : isEditing ? t('saveButton') : t('createButton')}
        </Button>
      </div>
    </form>
  )
}
