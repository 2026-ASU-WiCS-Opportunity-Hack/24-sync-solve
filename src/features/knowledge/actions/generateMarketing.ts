'use server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from '@/lib/utils/serverAuth'

export async function generateWebinarMarketing(webinarId: string) {
  const role = await getCurrentUserRole()
  if (!['super_admin', 'chapter_lead', 'content_editor'].includes(role || '')) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  const { data: w } = await supabase
    .from('webinars')
    .select('title, description, presenter, scheduled_at')
    .eq('id', webinarId)
    .single()
  if (!w) throw new Error('Not found')

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: `Create marketing for a WIAL webinar. Return ONLY valid JSON:
{
  "linkedin_post": "max 300 chars with hook + CTA",
  "email_subject": "max 60 chars",
  "email_body": "3 paragraphs ending with Register Now",
  "content_outline": [{ "timecode": "0:00", "segment": "description" }]
}
Webinar: ${w.title}
Presenter: ${w.presenter}
Description: ${w.description}`,
  })

  const cleanText = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/g, '')
    .trim()
  const marketing = JSON.parse(cleanText)
  await supabase.from('webinars').update({ marketing }).eq('id', webinarId)
  return { success: true, marketing }
}
