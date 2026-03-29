'use client'

import { useState } from 'react'
import { generateWebinarMarketing } from '@/features/knowledge/actions/generateMarketing'
import { toast } from 'sonner'
import { Sparkles, Copy, Check, X } from 'lucide-react'

type MarketingContent = {
  linkedin_post: string
  email_subject: string
  email_body: string
  content_outline: { timecode: string; segment: string }[]
}

export function WebinarPromoterModal({ webinarId, title }: { webinarId: string; title: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<MarketingContent | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await generateWebinarMarketing(webinarId)
      setContent(res.marketing)
      toast.success('Marketing generated!')
    } catch (err: any) {
      toast.error(err.message || 'Error generating marketing')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Copied to clipboard')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-wial-red/10 text-wial-red hover:bg-wial-red/20 flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        AI Promoter
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in-95 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-wial-navy flex items-center gap-2 text-xl font-bold">
                  <Sparkles className="text-wial-red h-5 w-5" /> AI Webinar Promoter
                </h2>
                <p className="mt-1 text-sm font-normal text-gray-500">
                  Generate LinkedIn posts, email copy, and a structural outline for:{' '}
                  <strong className="text-gray-800">{title}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-6 py-6">
              {!content ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="text-wial-red mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    Automate Your Marketing
                  </h3>
                  <p className="mb-8 max-w-sm text-sm text-gray-500">
                    Our AI will analyze the webinar details and generate ready-to-post social media
                    copy and email teasers perfectly tuned for your audience.
                  </p>
                  <button
                    className="bg-wial-red hover:bg-wial-red-dark inline-flex w-48 items-center justify-center rounded-lg px-6 py-2.5 font-semibold text-white shadow-md transition-colors disabled:opacity-50"
                    disabled={loading}
                    onClick={handleGenerate}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Analyzing...
                      </span>
                    ) : (
                      'Generate Now'
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* LinkedIn */}
                  <div className="overflow-hidden rounded-xl border shadow-sm">
                    <div className="flex items-center justify-between border-b bg-blue-50/50 px-4 py-3">
                      <h4 className="font-semibold text-blue-900">LinkedIn Post</h4>
                      <button
                        onClick={() => handleCopy(content.linkedin_post, 'linkedin')}
                        className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-blue-100"
                      >
                        {copied === 'linkedin' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="bg-white p-4 text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                      {content.linkedin_post}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="overflow-hidden rounded-xl border shadow-sm">
                    <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
                      <h4 className="font-semibold text-gray-900">Email Teaser</h4>
                      <button
                        onClick={() =>
                          handleCopy(`${content.email_subject}\n\n${content.email_body}`, 'email')
                        }
                        className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-200"
                      >
                        {copied === 'email' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="flex flex-col gap-1 border-b bg-white px-4 py-3">
                      <span className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Subject Line
                      </span>
                      <div className="font-semibold text-gray-900">{content.email_subject}</div>
                    </div>
                    <div className="bg-white p-4 text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                      {content.email_body}
                    </div>
                  </div>

                  {/* Outline */}
                  {content.content_outline && content.content_outline.length > 0 && (
                    <div className="overflow-hidden rounded-xl border shadow-sm">
                      <div className="border-b bg-orange-50/50 px-4 py-3">
                        <h4 className="font-semibold text-orange-900">
                          Content Outline (For Video Editor)
                        </h4>
                      </div>
                      <div className="bg-white p-0">
                        <ul className="divide-y text-sm">
                          {content.content_outline.map((item, i) => (
                            <li key={i} className="flex px-4 py-3">
                              <span className="text-wial-red w-16 flex-shrink-0 font-mono font-medium">
                                {item.timecode}
                              </span>
                              <span className="text-gray-700">{item.segment}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t bg-gray-50 px-6 py-4">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                {content ? 'Done' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
