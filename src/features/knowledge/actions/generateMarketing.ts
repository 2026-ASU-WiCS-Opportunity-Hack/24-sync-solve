'use server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from '@/lib/utils/serverAuth'
import type { AiModelProvider } from '@/features/knowledge/types'
import type { SupabaseClient } from '@supabase/supabase-js'

const MARKETING_PROMPT = (
  title: string,
  presenter: string,
  description: string
) => `Create marketing content for a WIAL webinar. Return ONLY valid JSON:
{
  "linkedin_post": "max 300 chars with hook + CTA",
  "email_subject": "max 60 chars",
  "email_body": "3 paragraphs ending with Register Now",
  "content_outline": [{ "timecode": "0:00", "segment": "description" }]
}
Webinar: ${title}
Presenter: ${presenter}
Description: ${description}`

export async function generateWebinarMarketing(
  webinarId: string,
  modelProvider: AiModelProvider = 'gpt-4o'
) {
  const role = await getCurrentUserRole()
  if (!['super_admin', 'chapter_lead', 'content_editor'].includes(role ?? '')) {
    throw new Error('Unauthorized')
  }

  // Cast to untyped client until DB types are regenerated with new tables
  const supabase = (await createClient()) as unknown as SupabaseClient

  const { data: w } = await supabase
    .from('webinars')
    .select('title, description, presenter, scheduled_at')
    .eq('id', webinarId)
    .single<{ title: string; description: string; presenter: string; scheduled_at: string }>()
  if (!w) throw new Error('Webinar not found')

  // Supports GPT-4o (default for video marketing) or Claude
  const model =
    modelProvider === 'claude'
      ? anthropic('claude-3-5-sonnet-20241022')
      : openai('gpt-4o')

  const { text } = await generateText({
    model,
    prompt: MARKETING_PROMPT(w.title ?? '', w.presenter ?? '', w.description ?? ''),
  })

  const cleanText = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/g, '')
    .trim()

  const marketing = JSON.parse(cleanText) as {
    linkedin_post: string
    email_subject: string
    email_body: string
    content_outline: { timecode: string; segment: string }[]
  }

  await supabase.from('webinars').update({ marketing }).eq('id', webinarId)
  return { success: true, marketing, modelUsed: modelProvider }
}
