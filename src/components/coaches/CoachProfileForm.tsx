'use client'

import { useActionState, useTransition, useState, useRef } from 'react'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button, Input, Label, TextArea } from '@heroui/react'
import { updateCoachProfileAction } from '@/features/coaches/actions/updateCoachProfile'
import { ImageUpload } from '@/components/editor/ImageUpload'
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
  const t = useTranslations('coaches.edit')
  const [, startTransition] = useTransition()
  const [specializationInput, setSpecializationInput] = useState('')
  const [languageInput, setLanguageInput] = useState('')
  const [specializations, setSpecializations] = useState<string[]>(coach.specializations ?? [])
  const [languages, setLanguages] = useState<string[]>(coach.languages ?? [])
  const [photoUrl, setPhotoUrl] = useState<string>(coach.photo_url ?? '')
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
        // Inject managed fields
        specializations.forEach((s) => formData.append('specializations', s))
        languages.forEach((l) => formData.append('languages', l))
        formData.set('photo_url', photoUrl)
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

      {/* Profile photo */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-wial-navy mb-1 text-base font-semibold">Profile Photo</h2>
        <p className="mb-4 text-xs text-gray-500">
          This photo appears on your public coach profile. Square images work best.
        </p>
        <div className="max-w-xs">
          <ImageUpload
            value={photoUrl}
            onChange={setPhotoUrl}
            bucket="coach-photos"
            pathPrefix="profiles"
            previewAlt="Coach profile photo"
            label="Upload profile photo"
          />
        </div>
      </div>

      {/* Bio */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-wial-navy mb-4 text-base font-semibold">{t('aboutSection')}</h2>
        <div>
          <label htmlFor="bio" className="mb-1 block text-sm font-medium text-gray-700">
            {t('bioLabel')}
          </label>
          <p className="mb-1 text-xs text-gray-500">{t('bioHint')}</p>
          <TextArea
            id="bio"
            name="bio"
            defaultValue={coach.bio ?? ''}
            rows={6}
            maxLength={2000}
            placeholder={t('bioPlaceholder')}
            aria-invalid={!!(state && !state.success && state.fieldErrors?.['bio']) || undefined}
            className="w-full"
          />
          {state && !state.success && state.fieldErrors?.['bio'] && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {state.fieldErrors['bio'][0]}
            </p>
          )}
        </div>
      </div>

      {/* Specializations */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-wial-navy mb-4 text-base font-semibold">
          {t('specializationsSection')}
        </h2>
        <p className="mb-3 text-xs text-gray-500">{t('specializationsHint')}</p>

        {/* Current specializations */}
        {specializations.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2" aria-label={t('specializationsLabel')}>
            {specializations.map((spec) => (
              <li
                key={spec}
                className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm"
              >
                {spec}
                <Button
                  type="button"
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onPress={() => removeSpecialization(spec)}
                  className="hover:text-wial-red ms-1 h-4 min-h-4 w-4 min-w-4 text-gray-400"
                  aria-label={t('removeItemLabel', { item: spec })}
                >
                  <X size={12} />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {/* Add input — keep native datalist for browser autocomplete suggestions */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
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
              placeholder={t('addSpecializationPlaceholder')}
              aria-label={t('addSpecializationLabel')}
              list="specialization-suggestions"
            />
            <datalist id="specialization-suggestions">
              {COMMON_SPECIALIZATIONS.filter((s) => !specializations.includes(s)).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <Button
            type="button"
            onPress={() => addSpecialization(specializationInput)}
            isDisabled={!specializationInput.trim() || specializations.length >= 20}
            variant="outline"
          >
            <Plus size={14} aria-hidden="true" />
            {t('addButton')}
          </Button>
        </div>
        {state && !state.success && state.fieldErrors?.['specializations'] && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors['specializations'][0]}</p>
        )}
      </div>

      {/* Languages */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-wial-navy mb-4 text-base font-semibold">{t('languagesSection')}</h2>
        <p className="mb-3 text-xs text-gray-500">{t('languagesHint')}</p>

        {/* Current languages */}
        {languages.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2" aria-label={t('languagesLabel')}>
            {languages.map((lang) => (
              <li
                key={lang}
                className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-800"
              >
                {lang}
                <Button
                  type="button"
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onPress={() => removeLanguage(lang)}
                  className="ms-1 h-4 min-h-4 w-4 min-w-4 text-blue-400 hover:text-blue-700"
                  aria-label={t('removeItemLabel', { item: lang })}
                >
                  <X size={12} />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {/* Add input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
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
              placeholder={t('addLanguagePlaceholder')}
              aria-label={t('addLanguageLabel')}
              list="language-suggestions"
            />
            <datalist id="language-suggestions">
              {COMMON_LANGUAGES.filter((l) => !languages.includes(l)).map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>
          <Button
            type="button"
            onPress={() => addLanguage(languageInput)}
            isDisabled={!languageInput.trim() || languages.length >= 10}
            variant="outline"
          >
            <Plus size={14} aria-hidden="true" />
            {t('addButton')}
          </Button>
        </div>
        {state && !state.success && state.fieldErrors?.['languages'] && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors['languages'][0]}</p>
        )}
      </div>

      {/* Location & Contact */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-wial-navy mb-4 text-base font-semibold">{t('locationSection')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label id="location_city-label" htmlFor="location_city">
              {t('locationCityLabel')}
            </Label>
            <Input
              id="location_city"
              aria-labelledby="location_city-label"
              name="location_city"
              type="text"
              defaultValue={coach.location_city ?? ''}
              placeholder="e.g. Washington D.C."
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label id="location_country-label" htmlFor="location_country">
              {t('locationCountryLabel')}
            </Label>
            <Input
              id="location_country"
              aria-labelledby="location_country-label"
              name="location_country"
              type="text"
              defaultValue={coach.location_country ?? ''}
              placeholder="e.g. United States"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label id="contact_email-label" htmlFor="contact_email">
              {t('contactEmailLabel')}
            </Label>
            <p className="text-xs text-gray-500">{t('contactEmailPublicNote')}</p>
            <Input
              id="contact_email"
              aria-labelledby="contact_email-label"
              name="contact_email"
              type="email"
              defaultValue={coach.contact_email ?? ''}
              placeholder="coach@example.com"
              aria-invalid={
                !!(state && !state.success && state.fieldErrors?.['contact_email']) || undefined
              }
            />
            {state && !state.success && state.fieldErrors?.['contact_email'] && (
              <p className="text-xs text-red-600" role="alert">
                {state.fieldErrors['contact_email'][0]}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label id="linkedin_url-label" htmlFor="linkedin_url">
              {t('linkedinLabel')}
            </Label>
            <Input
              id="linkedin_url"
              aria-labelledby="linkedin_url-label"
              name="linkedin_url"
              type="url"
              defaultValue={coach.linkedin_url ?? ''}
              placeholder="https://linkedin.com/in/yourprofile"
              aria-invalid={
                !!(state && !state.success && state.fieldErrors?.['linkedin_url']) || undefined
              }
            />
            {state && !state.success && state.fieldErrors?.['linkedin_url'] && (
              <p className="text-xs text-red-600" role="alert">
                {state.fieldErrors['linkedin_url'][0]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Locked fields notice */}
      <p className="text-xs text-gray-400">
        <strong>{t('lockedFieldsNote')}</strong> {t('lockedFields')}
      </p>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          type="submit"
          isDisabled={isPending}
          isPending={isPending}
          className="bg-wial-navy hover:bg-wial-navy-light rounded-xl px-6 text-sm font-semibold text-white shadow-sm"
        >
          {isPending ? t('saving') : t('saveButton')}
        </Button>
      </div>
    </form>
  )
}
