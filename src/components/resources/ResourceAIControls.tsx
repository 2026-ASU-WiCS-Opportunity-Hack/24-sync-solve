'use client'

import { useState } from 'react'
import { Sparkles, Megaphone, X, Copy, Check, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import {
  generateResourceMarketingAction,
  generateResourceSummaryAction,
} from '@/features/resources/actions/generateResourceAI'
import { transcribeVideoAction } from '@/features/resources/actions/transcribeVideoAction'
import type { ResourceMarketing, ResourceType, TranscriptStatus } from '@/features/resources/types'

function stripOptionPrefix(value: string): string {
  return value.replace(/^\s*(option\s*[12]|choice\s*[12])\s*[:.-]?\s*/i, '').trim()
}

function normalizeMarketing(marketing: ResourceMarketing | null): ResourceMarketing | null {
  if (!marketing) return null

  const asRecord = marketing as unknown as Record<string, unknown>
  const linkedinOptions = asRecord.linkedin_options
  const emailOptions = asRecord.email_options

  if (
    Array.isArray(linkedinOptions) &&
    linkedinOptions.length === 2 &&
    typeof linkedinOptions[0] === 'string' &&
    typeof linkedinOptions[1] === 'string' &&
    Array.isArray(emailOptions) &&
    emailOptions.length === 2
  ) {
    const first = emailOptions[0] as Record<string, unknown>
    const second = emailOptions[1] as Record<string, unknown>

    if (
      first &&
      second &&
      typeof first.subject === 'string' &&
      typeof first.body === 'string' &&
      typeof second.subject === 'string' &&
      typeof second.body === 'string'
    ) {
      return {
        linkedin_options: [
          stripOptionPrefix(linkedinOptions[0]),
          stripOptionPrefix(linkedinOptions[1]),
        ],
        email_options: [
          { subject: first.subject, body: first.body },
          { subject: second.subject, body: second.body },
        ],
      }
    }
  }

  const legacyLinkedin = asRecord.linkedin_post
  const legacyEmailSubject = asRecord.email_subject
  const legacyEmailBody = asRecord.email_body

  if (
    typeof legacyLinkedin === 'string' &&
    typeof legacyEmailSubject === 'string' &&
    typeof legacyEmailBody === 'string'
  ) {
    const cleanLinkedin = stripOptionPrefix(legacyLinkedin)
    return {
      linkedin_options: [cleanLinkedin, cleanLinkedin],
      email_options: [
        { subject: legacyEmailSubject, body: legacyEmailBody },
        { subject: legacyEmailSubject, body: legacyEmailBody },
      ],
    }
  }

  return null
}

interface ResourceAIControlsProps {
  resourceId: string
  resourceType: ResourceType
  canGenerateAI: boolean
  initialSummary: string | null
  initialMarketing: ResourceMarketing | null
  initialTranscript?: string | null
  initialTranscriptStatus?: TranscriptStatus
}

export function ResourceAIControls({
  resourceId,
  resourceType,
  canGenerateAI,
  initialSummary,
  initialMarketing,
  initialTranscript = null,
  initialTranscriptStatus = 'idle',
}: ResourceAIControlsProps) {
  const [summary, setSummary] = useState<string | null>(initialSummary)
  const [marketing, setMarketing] = useState<ResourceMarketing | null>(
    normalizeMarketing(initialMarketing)
  )
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isGeneratingMarketing, setIsGeneratingMarketing] = useState(false)
  const [isLinkedInOpen, setIsLinkedInOpen] = useState(false)
  const [isEmailOpen, setIsEmailOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [selectedLinkedInOption, setSelectedLinkedInOption] = useState<0 | 1>(0)
  const [selectedEmailOption, setSelectedEmailOption] = useState<0 | 1>(0)

  // ── Transcription state ────────────────────────────────────────────────────
  const [transcript, setTranscript] = useState<string | null>(initialTranscript)
  const [transcriptStatus, setTranscriptStatus] =
    useState<TranscriptStatus>(initialTranscriptStatus)
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false)

  const canSummarizeType =
    resourceType === 'video' || resourceType === 'article' || resourceType === 'pdf'
  const summaryUnavailable = !canSummarizeType
  const showSummaryPanel = canSummarizeType && Boolean(summary)

  const isVideoType = resourceType === 'video'
  const transcriptButtonLabel =
    transcriptStatus === 'processing'
      ? 'Transcribing…'
      : transcript
        ? 'View Transcript'
        : 'Transcribe Video'

  const actionButtonBase =
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm transition-all hover:-translate-y-px hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
  const summaryButtonClass =
    'border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 focus:ring-indigo-300'
  const linkedinButtonClass =
    'border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 focus:ring-sky-300'
  const emailButtonClass =
    'border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 focus:ring-teal-300'

  async function handleGenerateSummary() {
    if (!canGenerateAI) {
      toast.error('You do not have permission to generate AI content.')
      return
    }
    setIsGeneratingSummary(true)
    const res = await generateResourceSummaryAction(resourceId)
    setIsGeneratingSummary(false)

    if (!res.success) {
      toast.error(res.error)
      return
    }

    setSummary(res.data.summary)
    toast.success(res.message ?? 'Summary ready.')
  }

  function handleSummaryClick() {
    if (summaryUnavailable) {
      toast.error('AI summary is available for video, article, and PDF resources only.')
      return
    }

    if (!summary) {
      void handleGenerateSummary()
      return
    }

    toast.success('AI summary is already available below.')
  }

  async function handleGenerateMarketing() {
    if (!canGenerateAI) {
      toast.error('You do not have permission to generate promoter copy.')
      return
    }
    setIsGeneratingMarketing(true)
    const res = await generateResourceMarketingAction(resourceId)
    setIsGeneratingMarketing(false)

    if (!res.success) {
      toast.error(res.error)
      return
    }

    setMarketing(normalizeMarketing(res.data.marketing))
    toast.success(res.message ?? 'Promoter copy ready.')
  }

  async function handleOpenLinkedIn() {
    if (!canGenerateAI) {
      toast.error('You do not have permission to generate promoter copy.')
      return
    }

    setIsLinkedInOpen(true)
    if (!marketing) {
      await handleGenerateMarketing()
    }
  }

  async function handleOpenEmail() {
    if (!canGenerateAI) {
      toast.error('You do not have permission to generate promoter copy.')
      return
    }

    setIsEmailOpen(true)
    if (!marketing) {
      await handleGenerateMarketing()
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
    toast.success('Copied')
  }

  async function handleTranscribe() {
    if (!canGenerateAI) {
      toast.error('You do not have permission to transcribe resources.')
      return
    }

    // Toggle view if already transcribed
    if (transcript) {
      setIsTranscriptExpanded((prev) => !prev)
      return
    }

    if (transcriptStatus === 'processing') return

    setTranscriptStatus('processing')
    const res = await transcribeVideoAction(resourceId)

    if (!res.success) {
      setTranscriptStatus('failed')
      toast.error(res.error)
      return
    }

    setTranscript(res.data.transcript)
    setTranscriptStatus('completed')
    setIsTranscriptExpanded(true)

    if (res.data.summaryGenerated) {
      toast.success('Video transcribed and AI summary generated from transcript.')
    } else {
      toast.success('Video transcribed successfully.')
    }
  }

  return (
    <div className="mt-2 space-y-3">
      {showSummaryPanel && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
          <p className="mb-1 text-[11px] font-semibold tracking-wide text-indigo-700 uppercase">
            AI Summary
          </p>
          <p className="text-xs leading-relaxed text-gray-700">{summary}</p>
        </div>
      )}

      {/* Transcript panel */}
      {transcript && isTranscriptExpanded && (
        <div className="rounded-lg border border-violet-100 bg-violet-50/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold tracking-wide text-violet-700 uppercase">
              Transcript
            </p>
            <button
              type="button"
              onClick={() => setIsTranscriptExpanded(false)}
              className="text-violet-500 hover:text-violet-700 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
              aria-label="Collapse transcript"
            >
              <ChevronUp size={13} aria-hidden="true" />
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto">
            <p className="text-xs leading-relaxed whitespace-pre-wrap text-gray-700">
              {transcript}
            </p>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => handleCopy(transcript, 'transcript')}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-600 hover:text-violet-800"
              aria-label="Copy transcript"
            >
              {copied === 'transcript' ? (
                <Check size={11} className="text-green-600" aria-hidden="true" />
              ) : (
                <Copy size={11} aria-hidden="true" />
              )}
              Copy
            </button>
          </div>
        </div>
      )}

      {transcript && !isTranscriptExpanded && (
        <button
          type="button"
          onClick={() => setIsTranscriptExpanded(true)}
          className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-800 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
          aria-label="Expand transcript"
        >
          <ChevronDown size={11} aria-hidden="true" />
          Show transcript
        </button>
      )}

      {canGenerateAI && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSummaryClick}
            disabled={isGeneratingSummary || summaryUnavailable}
            className={`${actionButtonBase} ${summaryButtonClass}`}
            title={summaryUnavailable ? 'Available for video, article, and PDF only.' : undefined}
          >
            <Sparkles size={12} aria-hidden="true" />
            {summaryUnavailable
              ? 'AI Summary (N/A)'
              : isGeneratingSummary
                ? 'Generating...'
                : 'AI Summary'}
          </button>

          {/* Transcribe button — video only */}
          {isVideoType && (
            <button
              type="button"
              onClick={() => void handleTranscribe()}
              disabled={transcriptStatus === 'processing'}
              className={`${actionButtonBase} border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100 focus:ring-violet-300`}
              aria-label={transcriptButtonLabel}
            >
              <FileText size={12} aria-hidden="true" />
              {transcriptStatus === 'failed' ? 'Retry Transcription' : transcriptButtonLabel}
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenLinkedIn}
            disabled={isGeneratingMarketing}
            className={`${actionButtonBase} ${linkedinButtonClass}`}
          >
            <Megaphone size={12} aria-hidden="true" />
            Promote on LinkedIn
          </button>

          <button
            type="button"
            onClick={handleOpenEmail}
            disabled={isGeneratingMarketing}
            className={`${actionButtonBase} ${emailButtonClass}`}
          >
            <Megaphone size={12} aria-hidden="true" />
            Promote in Email
          </button>
        </div>
      )}

      {isLinkedInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-wial-navy text-lg font-bold">Promote on LinkedIn</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkedInOpen(false)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              {!marketing ? (
                <button
                  type="button"
                  onClick={handleGenerateMarketing}
                  disabled={isGeneratingMarketing}
                  className="bg-wial-red inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isGeneratingMarketing ? 'Generating promoter copy...' : 'Generate LinkedIn Copy'}
                </button>
              ) : (
                <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-4">
                  <div className="mb-3 flex gap-2">
                    {[0, 1].map((idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedLinkedInOption(idx as 0 | 1)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${selectedLinkedInOption === idx ? 'border-blue-500 bg-blue-500 text-white' : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50'}`}
                        aria-pressed={selectedLinkedInOption === idx}
                      >
                        Option {idx + 1}
                      </button>
                    ))}
                  </div>

                  <div className="mb-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(marketing.linkedin_options[selectedLinkedInOption], 'linkedin')
                      }
                      className="rounded p-1 text-gray-500 hover:bg-blue-100"
                      aria-label="Copy LinkedIn post"
                    >
                      {copied === 'linkedin' ? (
                        <Check size={14} className="text-green-600" aria-hidden="true" />
                      ) : (
                        <Copy size={14} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-800">
                    {marketing.linkedin_options[selectedLinkedInOption]}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isEmailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-wial-navy text-lg font-bold">Promote in Email</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailOpen(false)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              {!marketing ? (
                <button
                  type="button"
                  onClick={handleGenerateMarketing}
                  disabled={isGeneratingMarketing}
                  className="bg-wial-red inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isGeneratingMarketing ? 'Generating promoter copy...' : 'Generate Email Copy'}
                </button>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <div className="mb-3 flex gap-2">
                    {[0, 1].map((idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedEmailOption(idx as 0 | 1)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${selectedEmailOption === idx ? 'border-teal-500 bg-teal-500 text-white' : 'border-teal-200 bg-white text-teal-700 hover:bg-teal-50'}`}
                        aria-pressed={selectedEmailOption === idx}
                      >
                        Option {idx + 1}
                      </button>
                    ))}
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          `${marketing.email_options[selectedEmailOption].subject}\n\n${marketing.email_options[selectedEmailOption].body}`,
                          'email'
                        )
                      }
                      className="rounded p-1 text-gray-500 hover:bg-gray-200"
                      aria-label="Copy email draft"
                    >
                      {copied === 'email' ? (
                        <Check size={14} className="text-green-600" aria-hidden="true" />
                      ) : (
                        <Copy size={14} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Subject
                  </p>
                  <p className="mb-3 text-sm font-semibold text-gray-900">
                    {marketing.email_options[selectedEmailOption].subject}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                    {marketing.email_options[selectedEmailOption].body}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
