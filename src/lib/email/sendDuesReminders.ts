import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from './send'
import { MembershipDuesReminder } from './templates/MembershipDuesReminder'

/**
 * Send membership dues reminder emails to coaches whose membership is expiring.
 * Designed to be called from a cron endpoint or scheduled task.
 *
 * Sends reminders at: 30 days, 14 days, 7 days before expiry, and 1 day after expiry.
 */
export async function sendDuesReminderEmails(): Promise<{ sent: number; errors: number }> {
  const adminClient = createAdminClient()
  const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://wial.org'

  const now = new Date()

  // Target: memberships expiring in ~30, ~14, ~7 days, or expired ~1 day ago
  // We use a ±12h window around each milestone to avoid double-sending
  const milestones = [30, 14, 7, -1] // days relative to today
  const windowHours = 12

  let sent = 0
  let errors = 0

  for (const dayOffset of milestones) {
    const targetDate = new Date(now)
    targetDate.setDate(targetDate.getDate() + dayOffset)

    const windowStart = new Date(targetDate)
    windowStart.setHours(windowStart.getHours() - windowHours)

    const windowEnd = new Date(targetDate)
    windowEnd.setHours(windowEnd.getHours() + windowHours)

    const { data: profiles, error } = await adminClient
      .from('profiles')
      .select('id, full_name, email, membership_expires_at, chapter_id, chapters(slug, name)')
      .eq('membership_status', 'active')
      .gte('membership_expires_at', windowStart.toISOString())
      .lte('membership_expires_at', windowEnd.toISOString())

    if (error) {
      console.error('[dues-reminder] Failed to fetch profiles:', error)
      errors++
      continue
    }

    if (!profiles) continue

    for (const profile of profiles) {
      if (!profile.email || !profile.membership_expires_at) continue

      const chapter = profile.chapters as { slug: string; name: string } | null

      if (!chapter) continue

      const expiresAt = new Date(profile.membership_expires_at)
      const daysUntilExpiry = Math.round(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      try {
        await sendEmail({
          to: profile.email,
          subject:
            daysUntilExpiry < 0
              ? `Your WIAL membership has expired`
              : `Your WIAL membership expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
          react: MembershipDuesReminder({
            recipientName: profile.full_name ?? profile.email,
            chapterName: chapter.name,
            chapterSlug: chapter.slug,
            expiresAt: profile.membership_expires_at,
            daysUntilExpiry,
            siteUrl,
          }),
        })
        sent++
      } catch (err) {
        console.error(`[dues-reminder] Failed to send to ${profile.email}:`, err)
        errors++
      }
    }
  }

  return { sent, errors }
}
