import { Resend } from 'resend'

/**
 * Resend email client.
 * Only instantiated server-side — never import in client components.
 */
let _resend: Resend | null = null

export function getResendClient(): Resend {
  if (!_resend) {
    const apiKey = process.env['RESEND_API_KEY']
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set.')
    }
    _resend = new Resend(apiKey)
  }
  return _resend
}

export const EMAIL_FROM = process.env['EMAIL_FROM'] ?? 'WIAL Global <noreply@wial.org>'

export const EMAIL_SUPPORT = process.env['EMAIL_SUPPORT'] ?? 'support@wial.org'
