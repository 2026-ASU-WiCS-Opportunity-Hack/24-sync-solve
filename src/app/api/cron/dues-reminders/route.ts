import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { sendDuesReminderEmails } from '@/lib/email/sendDuesReminders'

/**
 * Cron endpoint — send membership dues reminder emails.
 *
 * Called by Vercel Cron (see vercel.json). Runs daily at 09:00 UTC.
 * Protected by CRON_SECRET header to prevent unauthorized invocation.
 *
 * To test locally:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/dues-reminders
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env['CRON_SECRET']

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await sendDuesReminderEmails()
    console.log(`[dues-reminders] Completed: ${result.sent} sent, ${result.errors} errors`)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[dues-reminders] Cron job failed:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
