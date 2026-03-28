'use client'

import { useActionState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
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

const EVENT_TYPES = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'conference', label: 'Conference' },
  { value: 'certification', label: 'Certification Program' },
  { value: 'networking', label: 'Networking' },
  { value: 'other', label: 'Other' },
] as const

/** Format a datetime-local input value from an ISO string */
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  // Trim seconds & timezone for datetime-local
  return iso.slice(0, 16)
}

export function EventForm({ action, event, accentColor }: EventFormProps) {
  const [, startTransition] = useTransition()
  const [state, formAction, isPending] = useActionState<ActionResult<Event> | null, FormData>(
    action,
    null
  )

  const isEditing = !!event

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
          Event Title <span className="text-red-500">*</span>
        </label>
        <input
          id="event-title"
          name="title"
          type="text"
          required
          defaultValue={event?.title ?? ''}
          className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          placeholder="e.g. WIAL USA Annual Conference 2026"
        />
        {state && !state.success && state.fieldErrors?.['title'] && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors['title'][0]}</p>
        )}
      </div>

      {/* Event type */}
      <div>
        <label htmlFor="event-type" className="block text-sm font-medium text-gray-700">
          Event Type <span className="text-red-500">*</span>
        </label>
        <select
          id="event-type"
          name="event_type"
          required
          defaultValue={event?.event_type ?? 'workshop'}
          className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="event-description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="event-description"
          name="description"
          rows={4}
          defaultValue={event?.description ?? ''}
          className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          placeholder="Describe the event, objectives, and what attendees can expect..."
        />
      </div>

      {/* Date & time */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="event-start" className="block text-sm font-medium text-gray-700">
            Start Date & Time <span className="text-red-500">*</span>
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
            End Date & Time
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
          Timezone <span className="text-red-500">*</span>
        </label>
        <input
          id="event-timezone"
          name="timezone"
          type="text"
          required
          defaultValue={event?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
          list="timezone-list"
          className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          placeholder="e.g. America/New_York"
        />
        <datalist id="timezone-list">
          <option value="America/New_York" />
          <option value="America/Chicago" />
          <option value="America/Denver" />
          <option value="America/Los_Angeles" />
          <option value="Europe/London" />
          <option value="Europe/Paris" />
          <option value="Africa/Lagos" />
          <option value="Asia/Tokyo" />
          <option value="Asia/Shanghai" />
          <option value="Australia/Sydney" />
          <option value="America/Sao_Paulo" />
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
            // If unchecked we want is_virtual=false, but checkboxes only send value when checked
            // The action handles missing value as "false" via transform
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
          This is a virtual / online event
        </label>
      </div>

      {/* Location / Virtual link */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="event-location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            id="event-location"
            name="location_name"
            type="text"
            defaultValue={event?.location_name ?? ''}
            className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            placeholder="e.g. Washington Convention Center"
          />
        </div>
        <div>
          <label htmlFor="event-virtual-link" className="block text-sm font-medium text-gray-700">
            Virtual Meeting Link
          </label>
          <input
            id="event-virtual-link"
            name="virtual_link"
            type="url"
            defaultValue={event?.virtual_link ?? ''}
            className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            placeholder="https://zoom.us/..."
          />
          {state && !state.success && state.fieldErrors?.['virtual_link'] && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors['virtual_link'][0]}</p>
          )}
        </div>
      </div>

      {/* Registration & attendees */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="event-registration-url"
            className="block text-sm font-medium text-gray-700"
          >
            Registration URL
          </label>
          <input
            id="event-registration-url"
            name="registration_url"
            type="url"
            defaultValue={event?.registration_url ?? ''}
            className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            placeholder="https://eventbrite.com/..."
          />
          {state && !state.success && state.fieldErrors?.['registration_url'] && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors['registration_url'][0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="event-max-attendees" className="block text-sm font-medium text-gray-700">
            Max Attendees
          </label>
          <input
            id="event-max-attendees"
            name="max_attendees"
            type="number"
            min="1"
            defaultValue={event?.max_attendees ?? ''}
            className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            placeholder="Leave blank for unlimited"
          />
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label htmlFor="event-image-url" className="block text-sm font-medium text-gray-700">
          Event Image URL
        </label>
        <input
          id="event-image-url"
          name="image_url"
          type="url"
          defaultValue={event?.image_url ?? ''}
          className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          placeholder="https://..."
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
          Publish this event (make it visible on the public site)
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
          {isPending ? 'Saving...' : isEditing ? 'Save Event' : 'Create Event'}
        </button>
      </div>
    </form>
  )
}
