'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { z } from 'zod'

const faqSchema = z.object({
  heading: z.string().optional(),
  items: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .default([]),
})

interface FaqBlockProps {
  content: Record<string, unknown>
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const id = `faq-${question.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={id}
        className="text-wial-navy hover:text-wial-navy-dark focus:ring-wial-navy flex w-full items-center justify-between py-4 text-start text-sm font-semibold focus:ring-2 focus:outline-none"
      >
        {question}
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        id={id}
        role="region"
        aria-label={question}
        className={`text-sm leading-relaxed text-gray-600 ${isOpen ? 'pb-4' : 'hidden'}`}
      >
        {answer}
      </div>
    </div>
  )
}

export default function FaqBlock({ content }: FaqBlockProps) {
  const parsed = faqSchema.safeParse(content)
  const data = parsed.success ? parsed.data : faqSchema.parse({})

  if (data.items.length === 0) return null

  return (
    <section aria-label={data.heading ?? 'FAQ'} className="bg-white py-16">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {data.heading && <h2 className="text-wial-navy mb-8 text-3xl font-bold">{data.heading}</h2>}
        <div>
          {data.items.map((item, i) => (
            <FaqItem key={i} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  )
}
