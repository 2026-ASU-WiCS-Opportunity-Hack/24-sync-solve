'use client'

import { useActionState, useTransition, useState, useRef } from 'react'
import { toast } from 'sonner'
import { Plus, X, Loader2 } from 'lucide-react'
import { updateCoachProfileAction } from '@/features/coaches/actions/updateCoachProfile'
import type { ActionResult } from '@/types'
import type { CoachFullProfile } from '@/features/coaches/queries/getCoachById'

interface CoachProfileFormProps {
  coach: CoachFullProfile
}

const COMMON_SPECIALIZATIONS = [
  'Leadership Development',
  'Team Performance',
  'Problem Solving',
  'Strategic Planning',
  'Change Management',
  'Executive Coaching',
  'Organizational Development',
  'Innovation',
  'Conflict Resolution',
  'Communication',
]

const COMMON_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'Portuguese',
  'Mandarin',
  'Arabic',
  'German',
  'Japanese',
  'Russian',
  'Hindi',
]

export function CoachProfileForm({ coach }: CoachProfileFormProps) {
  const [, startTransition] = useTransition()
  const [specializationInput, setSpecializationInput] = useState('')
  const [languageInput, setLanguageInput] = useState('')
  const [specializations, setSpecializations] = useState<string[]>(coach.specializations ?? [])
  const [languages, setLanguages] = useState<string[]>(coach.languages ?? [])
  const formRef = useRef<HTMLFormElement>(null)

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateCoachProfileAction,
    null
  )

  // Show toast on success/error
  if (state?.success && state.message) {
    toast.success(state.message)
  }

  function addSpecialization(value: string) {
    const trimmed = value.trim()
    if (trimmed && !specializations.includes(trimmed) && specializations.length < 20) {
      setSpecializations((prev) => [...prev, trimmed])
      setSpecializationInput('')
    }
  }

  function removeSpecialization(spec: string) {
    setSpecializations((prev) => prev.filter((s) => s !== spec))
  }

  function addLanguage(value: string) {
    const trimmed = value.trim()
    if (trimmed && !languages.includes(trimmed) && languages.length < 10) {
      setLanguages((prev) => [...prev, trimmed])
      setLanguageInput('')
    }
  }

  function removeLanguage(lang: string) {
    setLanguages((prev) => prev.filter((l) => l !== lang))
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        // Inject managed array fields
        specializations.forEach((s) => formData.append('specializations', s))
        languages.forEach((l) => formData.append('languages', l))
        startTransition(() => formAction(formData))
      }}
      className="space-y-8"
      noValidate
    >
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

      {/* Bio */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-wial-navy mb-4 text-base font-semibold">About You</h2>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            Bio
          </label>
          <p className="mt-0.5 text-xs text-gray-500">
            Describe your background and approach to Action Learning (max 2000 characters).
          </p>
          <textarea
            id="bio"
            name="bio"
            defaultValue={coach.bio ?? ''}
            rows={6}
            maxLength={2000}
            className="focus:border-wial-navy focus:ring-wial-navy/20 mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            placeholder="Tell coaches and organizations about your background and approach to Action Learning..."
          />
          {state && !state.success && state.fieldErrors?.['bio'] && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors['bio'][0]}</p>
          )}
        </div>
      </div>

      {/* Specializations */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-wial-navy mb-4 text-base font-semibold">Specializations</h2>
        <p className="mb-3 text-xs text-gray-500">Add up to 20 areas of expertise.</p>

        {/* Current specializations */}
        {specializations.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2" aria-label="Your specializations">
            {specializations.map((spec) => (
              <li
                key={spec}
                className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm"
              >
                {spec}
                <button
                  type="button"
                  onClick={() => removeSpecialization(spec)}
                  className="hover:text-wial-red ml-1 text-gray-400"
                  aria-label={`Remove ${spec}`}
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <label htmlFor="specialization-input" className="sr-only">
              Add specialization
            </label>
            <input
              id="specialization-input"
              type="text"
              value={specializationInput}
              onChange={(e) => setSpecializationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSpecialization(specializationInput)
                }
              }}
              placeholder="Type a specialization and press Enter"
              list="specialization-suggestions"
              className="focus:border-wial-navy focus:ring-wial-navy/20 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            />
            <datalist id="specialization-suggestions">
              {COMMON_SPECIALIZATIONS.filter((s) => !specializations.includes(s)).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <button
            type="button"
            onClick={() => addSpecialization(specializationInput)}
            disabled={!specializationInput.trim() || specializations.length >= 20}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
        {state && !state.success && state.fieldErrors?.['specializations'] && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors['specializations'][0]}</p>
        )}
      </div>

      {/* Languages */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-wial-navy mb-4 text-base font-semibold">Languages</h2>
        <p className="mb-3 text-xs text-gray-500">Add languages you coach in (at least 1).</p>

        {/* Current languages */}
        {languages.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2" aria-label="Your languages">
            {languages.map((lang) => (
              <li
                key={lang}
                className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-800"
              >
                {lang}
                <button
                  type="button"
                  onClick={() => removeLanguage(lang)}
                  className="ml-1 text-blue-400 hover:text-blue-700"
                  aria-label={`Remove ${lang}`}
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <label htmlFor="language-input" className="sr-only">
              Add language
            </label>
            <input
              id="language-input"
              type="text"
              value={languageInput}
              onChange={(e) => setLanguageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addLanguage(languageInput)
                }
              }}
              placeholder="Type a language and press Enter"
              list="language-suggestions"
              className="focus:border-wial-navy focus:ring-wial-navy/20 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            />
            <datalist id="language-suggestions">
              {COMMON_LANGUAGES.filter((l) => !languages.includes(l)).map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>
          <button
            type="button"
            onClick={() => addLanguage(languageInput)}
            disabled={!languageInput.trim() || languages.length >= 10}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
        {state && !state.success && state.fieldErrors?.['languages'] && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors['languages'][0]}</p>
        )}
      </div>

      {/* Location & Contact */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-wial-navy mb-4 text-base font-semibold">Location & Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="location_city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              id="location_city"
              name="location_city"
              type="text"
              defaultValue={coach.location_city ?? ''}
              className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              placeholder="e.g. Washington D.C."
            />
          </div>
          <div>
            <label htmlFor="location_country" className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <input
              id="location_country"
              name="location_country"
              type="text"
              defaultValue={coach.location_country ?? ''}
              className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              placeholder="e.g. United States"
            />
          </div>
          <div>
            <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700">
              Contact Email <span className="font-normal text-gray-400">(shown publicly)</span>
            </label>
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={coach.contact_email ?? ''}
              className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              placeholder="coach@example.com"
            />
            {state && !state.success && state.fieldErrors?.['contact_email'] && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors['contact_email'][0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700">
              LinkedIn URL
            </label>
            <input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              defaultValue={coach.linkedin_url ?? ''}
              className="focus:border-wial-navy focus:ring-wial-navy/20 mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              placeholder="https://linkedin.com/in/yourprofile"
            />
            {state && !state.success && state.fieldErrors?.['linkedin_url'] && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors['linkedin_url'][0]}</p>
            )}
          </div>
        </div>
      </div>

      {/* Locked fields notice */}
      <p className="text-xs text-gray-400">
        <strong>Note:</strong> Certification level and published status are managed by WIAL
        administrators and cannot be changed here.
      </p>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="bg-wial-navy hover:bg-wial-navy-light inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
