'use server'

import { z } from 'zod'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send'
import { ContactFormNotification } from '@/lib/email/templates/ContactFormNotification'
import { ContactFormReceipt } from '@/lib/email/templates/ContactFormReceipt'
import { emailSchema } from '@/lib/utils/validation'
import React from 'react'

const contactFormSchema = z.object({
  name: z.string().min(1, 'contact.nameRequired').max(100),
  email: emailSchema,
  subject: z
    .string()
    .max(200)
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  message: z.string().min(1, 'contact.messageRequired').max(3000),
  chapter_slug: z.string().optional(),
})

export async function submitContactForm(
  _prev: { success: boolean; error: string },
  formData: FormData
): Promise<{ success: boolean; error: string }> {
  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    subject: (formData.get('subject') as string) || '',
    message: formData.get('message') as string,
    chapter_slug: (formData.get('chapter_slug') as string) || undefined,
  }

  const result = contactFormSchema.safeParse(raw)
  if (!result.success) {
    const tV = await getTranslations('validation')
    const firstKey = Object.values(result.error.flatten().fieldErrors)[0]?.[0]
    const firstError = firstKey
      ? (() => {
          try {
            return tV(firstKey as never)
          } catch {
            return firstKey
          }
        })()
      : 'Please check your input.'
    return { success: false, error: firstError }
  }

  const { name, email, subject, message, chapter_slug } = result.data

  // Resolve chapter contact email and name
  let chapterContactEmail: string | null = null
  let chapterName = 'Global'

  if (chapter_slug) {
    const supabase = await createClient()
    const { data: chapter } = await supabase
      .from('chapters')
      .select('contact_email, name')
      .eq('slug', chapter_slug)
      .eq('is_active', true)
      .single()

    if (chapter) {
      chapterContactEmail = chapter.contact_email ?? null
      chapterName = chapter.name
    }
  }

  // Determine recipient — chapter contact email or global fallback
  const recipientEmail =
    chapterContactEmail ?? process.env['EMAIL_GLOBAL_CONTACT'] ?? 'info@wial.org'

  // Send notification to chapter/global contact
  await sendEmail({
    to: recipientEmail,
    replyTo: email,
    subject: subject
      ? `[Contact] ${subject} — WIAL ${chapterName}`
      : `New contact form message from ${name} — WIAL ${chapterName}`,
    react: React.createElement(ContactFormNotification, {
      senderName: name,
      senderEmail: email,
      message,
      chapterName,
      subject,
    }),
  })

  // Send receipt to the form submitter
  await sendEmail({
    to: email,
    subject: `We received your message — WIAL ${chapterName}`,
    react: React.createElement(ContactFormReceipt, {
      senderName: name,
      chapterName,
      chapterContactEmail: recipientEmail,
    }),
  })

  return { success: true, error: '' }
}
