'use server'

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'
import type { ResourceMarketing, ResourceType } from '@/features/resources/types'
import type { Json } from '@/types/database'

interface ResourceRow {
  id: string
  chapter_id: string | null
  type: ResourceType
  title: string
  description: string | null
  url: string
  ai_summary: string | null
  ai_marketing: Json | null
}

interface CombinedAIOutput {
  summary: string
  linkedin_options: [string, string]
  email_options: [{ subject: string; body: string }, { subject: string; body: string }]
}

function stripOptionPrefix(value: string): string {
  return value.replace(/^\s*(option\s*[12]|choice\s*[12])\s*[:.-]?\s*/i, '').trim()
}

function isDetailedLinkedInPost(text: string): boolean {
  const trimmed = text.trim()
  const sentenceCount = (trimmed.match(/[.!?](\s|$)/g) ?? []).length
  return trimmed.length >= 900 && sentenceCount >= 6
}

function hasDetailedLinkedInOptions(marketing: ResourceMarketing): boolean {
  return marketing.linkedin_options.every(isDetailedLinkedInPost)
}

function cleanJson(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/g, '')
    .trim()
}

function parseCombinedAIOutput(text: string): CombinedAIOutput {
  const parsed = JSON.parse(cleanJson(text)) as Partial<CombinedAIOutput>
  const linkedinOptions = parsed.linkedin_options
  const emailOptions = parsed.email_options

  if (
    !parsed.summary ||
    !Array.isArray(linkedinOptions) ||
    linkedinOptions.length !== 2 ||
    typeof linkedinOptions[0] !== 'string' ||
    typeof linkedinOptions[1] !== 'string' ||
    !Array.isArray(emailOptions) ||
    emailOptions.length !== 2 ||
    !emailOptions[0] ||
    !emailOptions[1] ||
    typeof emailOptions[0].subject !== 'string' ||
    typeof emailOptions[0].body !== 'string' ||
    typeof emailOptions[1].subject !== 'string' ||
    typeof emailOptions[1].body !== 'string'
  ) {
    throw new Error('AI response was missing required fields.')
  }

  return {
    summary: parsed.summary.trim(),
    linkedin_options: [
      stripOptionPrefix(linkedinOptions[0]),
      stripOptionPrefix(linkedinOptions[1]),
    ],
    email_options: [
      {
        subject: emailOptions[0].subject.trim(),
        body: emailOptions[0].body.trim(),
      },
      {
        subject: emailOptions[1].subject.trim(),
        body: emailOptions[1].body.trim(),
      },
    ],
  }
}

function normalizeMarketing(marketing: Json | null): ResourceMarketing | null {
  if (!marketing || typeof marketing !== 'object' || Array.isArray(marketing)) return null

  const asRecord = marketing as Record<string, unknown>

  const linkedinOptions = asRecord.linkedin_options
  const emailOptions = asRecord.email_options
  if (
    Array.isArray(linkedinOptions) &&
    linkedinOptions.length === 2 &&
    typeof linkedinOptions[0] === 'string' &&
    typeof linkedinOptions[1] === 'string' &&
    Array.isArray(emailOptions) &&
    emailOptions.length === 2 &&
    typeof emailOptions[0] === 'object' &&
    emailOptions[0] !== null &&
    typeof emailOptions[1] === 'object' &&
    emailOptions[1] !== null
  ) {
    const first = emailOptions[0] as Record<string, unknown>
    const second = emailOptions[1] as Record<string, unknown>

    if (
      typeof first.subject === 'string' &&
      typeof first.body === 'string' &&
      typeof second.subject === 'string' &&
      typeof second.body === 'string'
    ) {
      return {
        linkedin_options: [
          stripOptionPrefix(linkedinOptions[0]),
          stripOptionPrefix(linkedinOptions[1]),
        ],
        email_options: [
          { subject: first.subject, body: first.body },
          { subject: second.subject, body: second.body },
        ],
      }
    }
  }

  // Backward compatibility with legacy single-option cache shape.
  const legacyLinkedin = asRecord.linkedin_post
  const legacyEmailSubject = asRecord.email_subject
  const legacyEmailBody = asRecord.email_body
  if (
    typeof legacyLinkedin === 'string' &&
    typeof legacyEmailSubject === 'string' &&
    typeof legacyEmailBody === 'string'
  ) {
    const cleanLinkedin = stripOptionPrefix(legacyLinkedin)
    return {
      linkedin_options: [cleanLinkedin, cleanLinkedin],
      email_options: [
        { subject: legacyEmailSubject, body: legacyEmailBody },
        { subject: legacyEmailSubject, body: legacyEmailBody },
      ],
    }
  }

  return null
}

async function getResourceOrThrow(resourceId: string): Promise<ResourceRow> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('resources')
    .select('id, chapter_id, type, title, description, url, ai_summary, ai_marketing')
    .eq('id', resourceId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Resource not found.')
  }

  return data as ResourceRow
}

async function ensureCombinedAICache(resource: ResourceRow): Promise<{
  summary: string
  marketing: ResourceMarketing
  fromCache: boolean
}> {
  const cachedMarketing = normalizeMarketing(resource.ai_marketing)
  if (resource.ai_summary && cachedMarketing && hasDetailedLinkedInOptions(cachedMarketing)) {
    return {
      summary: resource.ai_summary,
      marketing: cachedMarketing,
      fromCache: true,
    }
  }

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: `You are generating reusable promo content for a WIAL resource.
Return ONLY valid JSON in this exact format:
{
  "summary": "Exactly 3-4 concise plain-language sentences. No bullets.",
  "linkedin_options": [
    "A detailed LinkedIn post (900-1400 chars) with 7-10 sentences: opening hook, practical insight, concrete value, practical application, and strong CTA. Do not include labels like Option 1/2.",
    "A second detailed LinkedIn post (900-1400 chars) with a clearly different angle and 7-10 sentences: opening hook, practical insight, concrete value, practical application, and strong CTA. Do not include labels like Option 1/2."
  ],
  "email_options": [
    {
      "subject": "Option 1: Max 60 chars",
      "body": "Option 1: 2-3 short paragraphs ending with a clear CTA"
    },
    {
      "subject": "Option 2: Max 60 chars",
      "body": "Option 2: 2-3 short paragraphs ending with a clear CTA"
    }
  ]
}

Resource Type: ${resource.type}
Title: ${resource.title}
Description: ${resource.description ?? 'N/A'}
URL: ${resource.url}`,
  })

  const combined = parseCombinedAIOutput(text)
  const summary = resource.ai_summary ?? combined.summary
  const marketing: ResourceMarketing = cachedMarketing ?? {
    linkedin_options: combined.linkedin_options,
    email_options: combined.email_options,
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('resources')
    .update({
      ai_summary: summary,
      ai_summary_generated_at: new Date().toISOString(),
      ai_marketing: marketing as unknown as Json,
      ai_marketing_generated_at: new Date().toISOString(),
    })
    .eq('id', resource.id)

  if (error) throw new Error(error.message)

  revalidatePath('/resources')
  revalidatePath('/[chapter]/resources', 'page')

  return { summary, marketing, fromCache: false }
}

export async function generateResourceSummaryAction(
  resourceId: string
): Promise<ActionResult<{ summary: string }>> {
  try {
    const resource = await getResourceOrThrow(resourceId)

    if (!['video', 'article', 'pdf'].includes(resource.type)) {
      return { success: false, error: 'AI summary is supported only for video, article, and PDF.' }
    }

    const { summary, fromCache } = await ensureCombinedAICache(resource)

    return {
      success: true,
      data: { summary },
      message: fromCache
        ? 'Using cached summary.'
        : 'AI summary + promoter copy generated and cached.',
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to generate AI summary.',
    }
  }
}

export async function generateResourceMarketingAction(
  resourceId: string
): Promise<ActionResult<{ marketing: ResourceMarketing }>> {
  try {
    const resource = await getResourceOrThrow(resourceId)

    const { marketing, fromCache } = await ensureCombinedAICache(resource)

    return {
      success: true,
      data: { marketing },
      message: fromCache
        ? 'Using cached promoter copy.'
        : 'Promoter copy + AI summary generated and cached.',
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to generate promoter copy.',
    }
  }
}

export async function prefillMissingResourceAIAction(
  resourceIds: string[]
): Promise<ActionResult<{ processed: number; generated: number; failed: number }>> {
  try {
    let generated = 0
    let failed = 0

    for (const resourceId of resourceIds) {
      const result = await generateResourceSummaryAction(resourceId)
      if (result.success) {
        generated += 1
      } else {
        failed += 1
      }
    }

    return {
      success: true,
      data: { processed: resourceIds.length, generated, failed },
      message: 'AI prefill completed.',
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to prefill AI content.',
    }
  }
}
