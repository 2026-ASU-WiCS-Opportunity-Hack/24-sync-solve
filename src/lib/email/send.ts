import type { ReactElement } from 'react'
import { getResendClient, EMAIL_FROM } from './client'

interface SendEmailOptions {
  to: string | string[]
  subject: string
  react: ReactElement
  replyTo?: string
}

/**
 * Send a transactional email via Resend.
 * Silently logs errors in development so missing env vars don't crash the app.
 * In production, errors are logged but not re-thrown to avoid breaking the
 * underlying server action — email delivery is best-effort.
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  try {
    const resend = getResendClient()
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      react: options.react,
      replyTo: options.replyTo,
    })
    if (error) {
      console.error('[email] Resend delivery error:', error)
    }
  } catch (err) {
    // Missing API key or network error — log, don't throw
    console.error('[email] sendEmail failed:', err)
  }
}
