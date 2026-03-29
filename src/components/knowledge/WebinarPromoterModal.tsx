'use client'

import { useState } from 'react'
import { generateWebinarMarketing } from '@/features/knowledge/actions/generateMarketing'
import { toast } from 'sonner'
import { Sparkles, Copy, Check, X } from 'lucide-react'
import type { AiModelProvider } from '@/features/knowledge/types'

type MarketingContent = {
  linkedin_post: string
  email_subject: string
  email_body: string
  content_outline: { timecode: string; segment: string }[]
}

interface WebinarPromoterModalProps {
  webinarId: string
  title: string
}

export function WebinarPromoterModal({ webinarId, title }: WebinarPromoterModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<MarketingContent | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [modelProvider, setModelProvider] = useState<AiModelProvider>('gpt-4o')

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await generateWebinarMarketing(webinarId, modelProvider)
      setContent(res.marketing)
      toast.success(
        `Marketing generated with ${res.modelUsed === 'claude' ? 'Claude' : 'GPT-4o'}!`
      )
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error generating marketing')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(console.error)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Copied to clipboard')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-wial-red/10 text-wial-red hover:bg-wial-red/20 flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
        aria-label={`Open AI Promoter for ${title}`}
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        AI Promoter
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="promoter-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b px-6 py-4">
              <div>
                <h2
                  id="promoter-dialog-title"
                  className="text-wial-navy flex items-center gap-2 text-xl font-bold"
                >
                  <Sparkles className="text-wial-red h-5 w-5" aria-hidden="true" /> AI Webinar
                  Promoter
                </h2>
                <p className="mt-1 text-sm font-normal text-gray-500">
                  Generate marketing copy for: <strong>{title}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Model selector */}
            <div className="border-b px-6 py-3">
              <fieldset>
                <legend className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  AI Model
                </legend>
                <div className="flex gap-4">
                  {(['gpt-4o', 'claude'] as AiModelProvider[]).map((m) => (
                    <label key={m} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="promoter-model"
                        value={m}
                        checked={modelProvider === m}
                        onChange={() => setModelProvider(m)}
                        className="accent-wial-red"
                      />
                      {m === 'claude' ? 'Claude (claude-3-5-sonnet)' : 'GPT-4o'}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Body */}
            <div className="flex-grow overflow-y-auto p-6">
              {!content ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Sparkles className="text-wial-red mb-4 h-12 w-12 opacity-60" />
                  <p className="mb-6 text-gray-500">
                    Generate AI-powered marketing content for this webinar including a LinkedIn
                    post, email copy, and content outline.
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-wial-red hover:bg-wial-red/90 flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition disabled:opacity-50"
                  >
                    {loading ? (
                      <>Generating…</>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" aria-hidden="true" /> Generate Marketing
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* LinkedIn */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">LinkedIn Post</h3>
                      <button
                        onClick={() => handleCopy(content.linkedin_post, 'linkedin')}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                        aria-label="Copy LinkedIn post"
                      >
                        {copied === 'linkedin' ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        Copy
                      </button>
                    </div>
                    <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      {content.linkedin_post}
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">Email</h3>
                      <button
                        onClick={() =>
                          handleCopy(
                            `Subject: ${content.email_subject}\n\n${content.email_body}`,
                            'email'
                          )
                        }
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                        aria-label="Copy email content"
                      >
                        {copied === 'email' ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        Copy
                      </button>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      <p className="mb-2 font-semibold">Subject: {content.email_subject}</p>
                      <p className="whitespace-pre-line">{content.email_body}</p>
                    </div>
                  </div>

                  {/* Content outline */}
                  {content.content_outline?.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-gray-700">Content Outline</h3>
                      <ul className="space-y-1 rounded-lg bg-gray-50 p-3">
                        {content.content_outline.map((item, idx) => (
                          <li key={idx} className="flex gap-3 text-sm text-gray-700">
                            <span className="text-wial-red shrink-0 font-mono font-semibold">
                              {item.timecode}
                            </span>
                            <span>{item.segment}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => setContent(null)}
                    className="text-wial-red text-sm font-medium hover:underline"
                  >
                    Regenerate
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
