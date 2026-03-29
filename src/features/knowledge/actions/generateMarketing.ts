'use server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from '@/lib/utils/serverAuth'

interface WebinarMarketingSource {
  title: string
  description: string | null
  presenter: string | null
  scheduled_at: string | null
}

interface UntypedWebinarsUpdate {
  update: (values: { marketing: unknown }) => {
    eq: (column: string, value: string) => Promise<unknown>
  }
}

export async function generateWebinarMarketing(webinarId: string) {
  const role = await getCurrentUserRole()
  if (!['super_admin', 'chapter_lead', 'content_editor'].includes(role || '')) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  const { data: webinarRow } = await supabase
    .from('webinars')
    .select('title, description, presenter, scheduled_at')
    .eq('id', webinarId)
    .single()
  if (!webinarRow) throw new Error('Not found')

  const webinar = webinarRow as unknown as WebinarMarketingSource

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: `Create marketing for a WIAL webinar. Return ONLY valid JSON:
{
  "linkedin_post": "max 300 chars with hook + CTA",
  "email_subject": "max 60 chars",
  "email_body": "3 paragraphs ending with Register Now",
  "content_outline": [{ "timecode": "0:00", "segment": "description" }]
}
Webinar: ${webinar.title}
Presenter: ${webinar.presenter ?? 'TBD'}
Description: ${webinar.description ?? ''}`,
  })

  const cleanText = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/g, '')
    .trim()
  const marketing = JSON.parse(cleanText)
  const webinarsTable = supabase.from('webinars' as never) as unknown as UntypedWebinarsUpdate
  await webinarsTable.update({ marketing }).eq('id', webinarId)
  return { success: true, marketing }
}
