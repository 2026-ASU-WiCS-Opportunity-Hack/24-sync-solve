'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button, Input, Label, ListBox, ListBoxItem, Select, TextArea } from '@heroui/react'
import { Music, PlusCircle, Trash2, Upload } from 'lucide-react'
import { generateChapterContentAction } from '@/features/content/actions/generateChapterContent'
import { generateChapterMusicAction } from '@/features/content/actions/generateChapterMusic'
import type { ActionResult } from '@/types'
import type { GenerateResult } from '@/features/content/actions/generateChapterContent'

// ── Types ───────────────────────────────────────────────────────────────────

interface CoachEntry {
  name: string
  bio: string
  title: string
  photo_url: string
}

interface ChapterInABoxFormProps {
  chapterId: string
  backHref?: string
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'ar', label: 'Arabic' },
  { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' },
] as const

const defaultCoach = (): CoachEntry => ({ name: '', bio: '', title: '', photo_url: '' })

const initialState: ActionResult<GenerateResult> | null = null

// ── Upload helper ────────────────────────────────────────────────────────────

async function uploadPhoto(file: File, bucket: 'coach-photos' | 'chapter-assets'): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('bucket', bucket)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!res.ok) throw new Error('Upload failed')
  const json = (await res.json()) as { url?: string }
  if (!json.url) throw new Error('No URL returned')
  return json.url
}

// ── Component ────────────────────────────────────────────────────────────────

export function ChapterInABoxForm({ chapterId, backHref }: ChapterInABoxFormProps) {
  const t = useTranslations('chapterInABox')
  const router = useRouter()

  const [state, formAction, isPending] = useActionState<
    ActionResult<GenerateResult> | null,
    FormData
  >(generateChapterContentAction, initialState)

  // Coach state
  const [coaches, setCoaches] = useState<CoachEntry[]>([defaultCoach()])
  const [coachUploading, setCoachUploading] = useState<boolean[]>([false])
  const [coachUploadError, setCoachUploadError] = useState<string[]>([''])

  // Testimonial photo
  const [testimonialPhoto, setTestimonialPhoto] = useState('')
  const [testimonialUploading, setTestimonialUploading] = useState(false)
  const [testimonialUploadError, setTestimonialUploadError] = useState('')

  // Hero image
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroUploadError, setHeroUploadError] = useState('')

  // Background music
  const [generateMusic, setGenerateMusic] = useState(false)
  const [musicPrompt, setMusicPrompt] = useState('')
  const [isMusicPending, startMusicTransition] = useTransition()

  // Hidden field ref to serialize coaches before submit
  const coachesFieldRef = useRef<HTMLInputElement>(null)
  const heroImageRef = useRef<HTMLInputElement>(null)
  const testimonialPhotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!state?.success) return

    // If music was requested, generate it now then navigate
    if (generateMusic && musicPrompt.trim()) {
      startMusicTransition(async () => {
        const fd = new FormData()
        fd.append('chapter_id', chapterId)
        fd.append('music_prompt', musicPrompt.trim())
        const musicResult = await generateChapterMusicAction(null, fd)
        if (musicResult.success) {
          toast.success(musicResult.message ?? t('musicSuccess'))
        } else {
          toast.error(`${t('musicError')}: ${musicResult.error}`)
        }
        toast.success(state.message ?? t('successMessage', { count: state.data.blocksUpdated }))
        router.push(`/${state.data.chapterSlug}/manage/approvals`)
      })
    } else {
      toast.success(state.message ?? t('successMessage', { count: state.data.blocksUpdated }))
      router.push(`/${state.data.chapterSlug}/manage/approvals`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  function fieldError(field: string): string | undefined {
    if (!state || state.success) return undefined
    return state.fieldErrors?.[field]?.[0]
  }

  // ── Coach helpers ───────────────────────────────────────────────────────

  function updateCoach(index: number, field: keyof CoachEntry, value: string) {
    setCoaches((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
  }

  function addCoach() {
    if (coaches.length >= 3) return
    setCoaches((prev) => [...prev, defaultCoach()])
    setCoachUploading((prev) => [...prev, false])
    setCoachUploadError((prev) => [...prev, ''])
  }

  function removeCoach(index: number) {
    if (coaches.length <= 1) return
    setCoaches((prev) => prev.filter((_, i) => i !== index))
    setCoachUploading((prev) => prev.filter((_, i) => i !== index))
    setCoachUploadError((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleCoachPhotoUpload(index: number, file: File) {
    setCoachUploading((prev) => prev.map((v, i) => (i === index ? true : v)))
    setCoachUploadError((prev) => prev.map((v, i) => (i === index ? '' : v)))
    try {
      const url = await uploadPhoto(file, 'coach-photos')
      updateCoach(index, 'photo_url', url)
    } catch {
      setCoachUploadError((prev) => prev.map((v, i) => (i === index ? t('uploadError') : v)))
    } finally {
      setCoachUploading((prev) => prev.map((v, i) => (i === index ? false : v)))
    }
  }

  async function handleTestimonialPhotoUpload(file: File) {
    setTestimonialUploading(true)
    setTestimonialUploadError('')
    try {
      const url = await uploadPhoto(file, 'chapter-assets')
      setTestimonialPhoto(url)
    } catch {
      setTestimonialUploadError(t('uploadError'))
    } finally {
      setTestimonialUploading(false)
    }
  }

  async function handleHeroImageUpload(file: File) {
    setHeroUploading(true)
    setHeroUploadError('')
    try {
      const url = await uploadPhoto(file, 'chapter-assets')
      setHeroImageUrl(url)
    } catch {
      setHeroUploadError(t('uploadError'))
    } finally {
      setHeroUploading(false)
    }
  }

  // Inject serialized state into hidden fields right before submit
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (coachesFieldRef.current) {
      coachesFieldRef.current.value = JSON.stringify(coaches)
    }
    if (heroImageRef.current) {
      heroImageRef.current.value = heroImageUrl
    }
    if (testimonialPhotoRef.current) {
      testimonialPhotoRef.current.value = testimonialPhoto
    }
    // Let the form proceed normally via formAction
    void e
  }

  const anyUploading = heroUploading || testimonialUploading || coachUploading.some(Boolean)
  const isSubmitting = isPending || isMusicPending

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="space-y-10"
      aria-label={t('pageTitle')}
    >
      {/* Hidden fields */}
      <input type="hidden" name="chapter_id" value={chapterId} />
      <input ref={coachesFieldRef} type="hidden" name="coaches" defaultValue="[]" />
      <input ref={heroImageRef} type="hidden" name="hero_image_url" defaultValue="" />
      <input ref={testimonialPhotoRef} type="hidden" name="testimonial_photo" defaultValue="" />

      {/* Global error */}
      {state && !state.success && !state.fieldErrors && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      {/* Approval note */}
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {t('approvalNote')}
      </p>

      {/* ── Language ──────────────────────────────────────────────────────── */}
      <section aria-labelledby="language-heading">
        <h2 id="language-heading" className="mb-4 text-base font-semibold text-gray-900">
          {t('languageLabel')}
        </h2>
        <div className="max-w-xs">
          <Select
            name="language"
            isRequired
            aria-label={t('languageLabel')}
            defaultSelectedKey="en"
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox aria-label={t('languageLabel')}>
                {LANGUAGES.map(({ code, label }) => (
                  <ListBoxItem key={code} id={code} textValue={label}>
                    {label}
                  </ListBoxItem>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </section>

      {/* ── Cultural context ───────────────────────────────────────────────── */}
      <section aria-labelledby="cultural-heading">
        <h2 id="cultural-heading" className="mb-1 text-base font-semibold text-gray-900">
          {t('culturalContextLabel')}
        </h2>
        <TextArea
          name="cultural_context"
          placeholder={t('culturalContextPlaceholder')}
          rows={3}
          className="w-full"
          aria-label={t('culturalContextLabel')}
        />
      </section>

      {/* ── Hero banner image ──────────────────────────────────────────────── */}
      <section aria-labelledby="hero-image-heading">
        <h2 id="hero-image-heading" className="mb-3 text-base font-semibold text-gray-900">
          {t('heroImageLabel')}
        </h2>
        <PhotoUploadField
          label={t('heroImageLabel')}
          photoUrl={heroImageUrl}
          isUploading={heroUploading}
          uploadError={heroUploadError}
          onFileSelect={handleHeroImageUpload}
          uploadButtonLabel={t('uploadButton')}
          uploadingLabel={t('uploading')}
          photoUploadedLabel={t('photoUploaded')}
        />
      </section>

      {/* ── Coach profiles ─────────────────────────────────────────────────── */}
      <section aria-labelledby="coaches-heading">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 id="coaches-heading" className="text-base font-semibold text-gray-900">
              {t('coachesHeading')}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">{t('coachesSubtitle')}</p>
          </div>
          {coaches.length < 3 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onPress={addCoach}
              aria-label={t('addCoach')}
              className="flex items-center gap-1.5 text-sm"
            >
              <PlusCircle size={14} aria-hidden="true" />
              {t('addCoach')}
            </Button>
          )}
        </div>

        {fieldError('coaches') && (
          <p className="mb-3 text-sm text-red-600" role="alert" aria-live="polite">
            {fieldError('coaches')}
          </p>
        )}

        <div className="space-y-6">
          {coaches.map((coach, index) => (
            <div
              key={index}
              className="relative rounded-xl border border-gray-200 bg-gray-50 p-5"
              aria-label={`Coach ${index + 1}`}
            >
              {coaches.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCoach(index)}
                  aria-label={`${t('removeCoach')} coach ${index + 1}`}
                  className="absolute inset-e-4 top-4 rounded p-1 text-gray-400 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`coach-name-${index}`} isRequired>
                    {t('coachNameLabel')}
                  </Label>
                  <Input
                    id={`coach-name-${index}`}
                    value={coach.name}
                    onChange={(e) => updateCoach(index, 'name', e.target.value)}
                    placeholder="Jane Doe"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor={`coach-title-${index}`}>{t('coachTitleLabel')}</Label>
                  <Input
                    id={`coach-title-${index}`}
                    value={coach.title}
                    onChange={(e) => updateCoach(index, 'title', e.target.value)}
                    placeholder="CALC Coach"
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <Label htmlFor={`coach-bio-${index}`} isRequired>
                    {t('coachBioLabel')}
                  </Label>
                  <TextArea
                    id={`coach-bio-${index}`}
                    value={coach.bio}
                    onChange={(e) => updateCoach(index, 'bio', e.target.value)}
                    placeholder="Brief bio describing this coach's background and expertise..."
                    rows={3}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-sm font-medium text-gray-700">{t('coachPhotoLabel')}</span>
                  <PhotoUploadField
                    label={`${t('coachPhotoLabel')} for ${coach.name || `coach ${index + 1}`}`}
                    photoUrl={coach.photo_url}
                    isUploading={coachUploading[index] ?? false}
                    uploadError={coachUploadError[index] ?? ''}
                    onFileSelect={(file) => handleCoachPhotoUpload(index, file)}
                    uploadButtonLabel={t('uploadButton')}
                    uploadingLabel={t('uploading')}
                    photoUploadedLabel={t('photoUploaded')}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Upcoming event ─────────────────────────────────────────────────── */}
      <section aria-labelledby="event-heading">
        <h2 id="event-heading" className="mb-4 text-base font-semibold text-gray-900">
          {t('eventHeading')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="event_title">{t('eventTitleLabel')}</Label>
            <Input id="event_title" name="event_title" placeholder="Action Learning Workshop" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="event_date">{t('eventDateLabel')}</Label>
            <Input id="event_date" name="event_date" type="date" />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Label htmlFor="event_description">{t('eventDescLabel')}</Label>
            <TextArea
              id="event_description"
              name="event_description"
              placeholder="Brief description of what attendees will learn or experience..."
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* ── Testimonial ────────────────────────────────────────────────────── */}
      <section aria-labelledby="testimonial-heading">
        <h2 id="testimonial-heading" className="mb-1 text-base font-semibold text-gray-900">
          {t('testimonialHeading')}
        </h2>
        <p className="mb-4 text-sm text-gray-500">{t('testimonialSubtitle')}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Label htmlFor="testimonial_quote" isRequired>
              {t('testimonialQuoteLabel')}
            </Label>
            <TextArea
              id="testimonial_quote"
              name="testimonial_quote"
              placeholder="Action Learning transformed how our team approaches complex challenges..."
              rows={3}
              required
            />
            {fieldError('testimonial_quote') && (
              <p className="text-xs text-red-600" role="alert">
                {fieldError('testimonial_quote')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="testimonial_author" isRequired>
              {t('testimonialAuthorLabel')}
            </Label>
            <Input
              id="testimonial_author"
              name="testimonial_author"
              placeholder="John Smith"
              required
            />
            {fieldError('testimonial_author') && (
              <p className="text-xs text-red-600" role="alert">
                {fieldError('testimonial_author')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="testimonial_title">{t('testimonialTitleLabel')}</Label>
            <Input
              id="testimonial_title"
              name="testimonial_title"
              placeholder="Head of Learning & Development"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="testimonial_org">{t('testimonialOrgLabel')}</Label>
            <Input id="testimonial_org" name="testimonial_org" placeholder="Acme Corporation" />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">{t('testimonialPhotoLabel')}</span>
            <PhotoUploadField
              label={t('testimonialPhotoLabel')}
              photoUrl={testimonialPhoto}
              isUploading={testimonialUploading}
              uploadError={testimonialUploadError}
              onFileSelect={handleTestimonialPhotoUpload}
              uploadButtonLabel={t('uploadButton')}
              uploadingLabel={t('uploading')}
              photoUploadedLabel={t('photoUploaded')}
            />
          </div>
        </div>
      </section>

      {/* ── Background Music (optional) ────────────────────────────────────── */}
      <section aria-labelledby="music-heading">
        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-5">
          <div className="flex items-start gap-3">
            <Music size={18} className="mt-0.5 shrink-0 text-violet-600" aria-hidden="true" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 id="music-heading" className="text-sm font-semibold text-violet-900">
                    {t('musicHeading')}
                    <span className="ms-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-600 uppercase">
                      {t('optional')}
                    </span>
                  </h2>
                  <p className="mt-0.5 text-xs text-violet-700">{t('musicSubtitle')}</p>
                </div>

                {/* Toggle */}
                <label className="flex cursor-pointer items-center gap-2">
                  <span className="sr-only">{t('musicToggleLabel')}</span>
                  <input
                    type="checkbox"
                    checked={generateMusic}
                    onChange={(e) => setGenerateMusic(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                    aria-describedby="music-heading"
                  />
                  <span className="text-xs font-medium text-violet-800">
                    {t('musicToggleLabel')}
                  </span>
                </label>
              </div>

              {generateMusic && (
                <div className="mt-4 flex flex-col gap-1">
                  <Label htmlFor="music_prompt" className="text-xs font-medium text-violet-900">
                    {t('musicPromptLabel')}
                  </Label>
                  <TextArea
                    id="music_prompt"
                    value={musicPrompt}
                    onChange={(e) => setMusicPrompt(e.target.value)}
                    placeholder={t('musicPromptPlaceholder')}
                    rows={2}
                    className="w-full text-sm"
                    aria-label={t('musicPromptLabel')}
                    aria-required="true"
                  />
                  <p className="text-[11px] text-violet-600">{t('musicPromptHint')}</p>
                  {generateMusic && !musicPrompt.trim() && (
                    <p className="text-[11px] text-amber-600" role="alert" aria-live="polite">
                      {t('musicPromptRequired')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Submit ─────────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6"
        aria-live="polite"
      >
        <Button
          type="submit"
          isDisabled={isSubmitting || anyUploading || (generateMusic && !musicPrompt.trim())}
          isPending={isSubmitting}
          className="bg-wial-navy hover:bg-wial-navy-dark rounded-lg px-6 text-sm font-semibold text-white"
        >
          {isMusicPending
            ? t('generatingMusic')
            : isPending
              ? t('generating')
              : generateMusic
                ? t('generateButtonWithMusic')
                : t('generateButton')}
        </Button>

        {backHref && (
          <Button
            type="button"
            variant="outline"
            onPress={() => router.push(backHref)}
            isDisabled={isSubmitting}
            className="rounded-lg px-5 text-sm font-semibold text-gray-700"
          >
            {t('skipLink')}
          </Button>
        )}

        {anyUploading && (
          <span className="text-sm text-gray-500" aria-live="polite">
            {t('uploading')}
          </span>
        )}
      </div>
    </form>
  )
}

// ── PhotoUploadField helper component ────────────────────────────────────────

interface PhotoUploadFieldProps {
  label: string
  photoUrl: string
  isUploading: boolean
  uploadError: string
  onFileSelect: (file: File) => void
  uploadButtonLabel: string
  uploadingLabel: string
  photoUploadedLabel: string
}

function PhotoUploadField({
  label,
  photoUrl,
  isUploading,
  uploadError,
  onFileSelect,
  uploadButtonLabel,
  uploadingLabel,
  photoUploadedLabel,
}: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-3">
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={label}
          className="h-12 w-12 rounded-full object-cover ring-1 ring-gray-200"
        />
      )}

      <label className="cursor-pointer">
        <span className="sr-only">{label}</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          aria-label={label}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelect(file)
          }}
        />
        <span
          role="button"
          aria-disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
        >
          <Upload size={14} aria-hidden="true" />
          {isUploading ? uploadingLabel : uploadButtonLabel}
        </span>
      </label>

      {!isUploading && photoUrl && (
        <span className="text-xs text-green-600" aria-live="polite">
          {photoUploadedLabel}
        </span>
      )}

      {uploadError && (
        <span className="text-xs text-red-600" role="alert" aria-live="polite">
          {uploadError}
        </span>
      )}
    </div>
  )
}
