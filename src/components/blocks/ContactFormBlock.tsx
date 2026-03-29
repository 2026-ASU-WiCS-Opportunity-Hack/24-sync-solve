'use client'

import { useActionState, useTransition } from 'react'
import { z } from 'zod'
import { Button, Input, TextArea } from '@heroui/react'
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
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Name{' '}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <Input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  className="w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Email{' '}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <Input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Message{' '}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              </label>
              <TextArea id="contact-message" name="message" required rows={5} className="w-full" />
            </div>

            <Button
              type="submit"
              isDisabled={isPending}
              isPending={isPending}
              fullWidth
              className="rounded-lg text-sm font-semibold text-white"
              style={accentStyle}
            >
              {isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        )}
      </div>
    </section>
  )
}
