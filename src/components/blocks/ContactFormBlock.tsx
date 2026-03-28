'use client'

import { useActionState, useTransition } from 'react'
import { z } from 'zod'
import { submitContactForm } from '@/features/chapters/actions/submitContactForm'

const contactSchema = z.object({
  heading: z.string().optional().default('Get in Touch'),
  subheading: z.string().optional(),
  recipient_email: z.string().email().optional(),
})

interface ContactFormBlockProps {
  content: Record<string, unknown>
  accentColor?: string
}

export default function ContactFormBlock({ content, accentColor }: ContactFormBlockProps) {
  const parsed = contactSchema.safeParse(content)
  const data = parsed.success ? parsed.data : contactSchema.parse({})
  const [state, formAction] = useActionState(submitContactForm, { success: false, error: '' })
  const [isPending, startTransition] = useTransition()

  const accentStyle = accentColor ? { backgroundColor: accentColor } : {}

  return (
    <section aria-label={data.heading} className="bg-gray-50 py-16">
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-wial-navy text-3xl font-bold">{data.heading}</h2>
          {data.subheading && <p className="mt-3 text-gray-600">{data.subheading}</p>}
        </div>

        {state.success ? (
          <div role="status" className="rounded-xl bg-green-50 p-6 text-center text-green-700">
            <p className="font-semibold">Message sent!</p>
            <p className="mt-1 text-sm">We&apos;ll get back to you shortly.</p>
          </div>
        ) : (
          <form
            action={(formData) => startTransition(() => formAction(formData))}
            className="space-y-4"
            noValidate
          >
            {state.error && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {state.error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  className="focus:border-wial-navy focus:ring-wial-navy/20 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="focus:border-wial-navy focus:ring-wial-navy/20 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                required
                className="focus:border-wial-navy focus:ring-wial-navy/20 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="bg-wial-red hover:bg-wial-red-dark w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
              style={accentStyle}
              aria-busy={isPending}
            >
              {isPending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
