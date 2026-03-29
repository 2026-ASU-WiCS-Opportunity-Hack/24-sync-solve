'use server'

import { revalidatePath } from 'next/cache'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canPerformInChapter, getPermissionContext } from '@/lib/permissions/context'
import { hasPermission } from '@/lib/permissions/permissions'
import { transcribeFromUrl, isDirectMediaUrl } from '@/lib/elevenlabs/transcription'
import type { ActionResult } from '@/types'
import type { ResourceType } from '@/features/resources/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ResourceForTranscription {
  id: string
  chapter_id: string | null
  type: ResourceType
  title: string
  description: string | null
  url: string
  transcript: string | null
  transcript_status: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchResourceForTranscription(
  resourceId: string
): Promise<ResourceForTranscription> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('resources')
    .select('id, chapter_id, type, title, description, url, transcript, transcript_status')
    .eq('id', resourceId)
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Resource not found.')

  return data as ResourceForTranscription
}

async function ensureCanTranscribe(resource: ResourceForTranscription): Promise<void> {
  const ctx = await getPermissionContext()
  if (!ctx) throw new Error('Authentication required.')
  if (ctx.isSuspended) throw new Error('Your account is suspended.')

  const allowed = resource.chapter_id
    ? canPerformInChapter(ctx, resource.chapter_id, 'content:create')
    : hasPermission(ctx.globalRole, 'content:create')

  if (!allowed) {
    throw new Error('You do not have permission to transcribe resources.')
  }
}

/**
 * Use Claude to generate an enhanced AI summary from a full transcript.
 * Returns the summary string or null if Claude is unavailable.
 */
async function generateSummaryFromTranscript(
  title: string,
  transcript: string
): Promise<string | null> {
  const anthropicKey = process.env['ANTHROPIC_API_KEY']
  if (!anthropicKey) return null

  try {
    const client = new Anthropic({ apiKey: anthropicKey })

    // Truncate transcript to ~12 000 chars to stay within token budget
    const truncated =
      transcript.length > 12000
        ? transcript.slice(0, 12000) + '\n\n[transcript truncated for length]'
        : transcript

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system:
        'You are summarising educational content for WIAL (World Institute for Action Learning). Write a concise, plain-language summary of the provided transcript in 3–4 sentences. Do NOT use bullet points or markdown. Output only the summary.',
      messages: [
        {
          role: 'user',
          content: `Title: ${title}\n\nTranscript:\n${truncated}`,
        },
      ],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : null
    return text ?? null
  } catch (err) {
    console.error('Claude summary-from-transcript error:', err)
    return null
  }
}

// ── Main action ───────────────────────────────────────────────────────────────

export interface TranscribeVideoResult {
  transcript: string
  /** Whether an AI summary was auto-generated from the transcript. */
  summaryGenerated: boolean
}

/**
 * Server action: transcribe a video resource using ElevenLabs Scribe v2.
 *
 * Requires a direct media file URL (MP4, MKV, MOV, WebM, MP3, WAV, etc.).
 * YouTube watch-page URLs are NOT supported — the resource must point to a
 * downloadable file (e.g. stored in Supabase Storage or a CDN).
 *
 * After successful transcription, Claude auto-generates an improved
 * AI summary from the transcript text and persists it alongside.
 */
export async function transcribeVideoAction(
  resourceId: string
): Promise<ActionResult<TranscribeVideoResult>> {
  try {
    // ── Load resource ───────────────────────────────────────────────────────
    const resource = await fetchResourceForTranscription(resourceId)
    await ensureCanTranscribe(resource)

    if (resource.type !== 'video') {
      return { success: false, error: 'Transcription is only available for video resources.' }
    }

    if (resource.transcript_status === 'processing') {
      return {
        success: false,
        error: 'This video is already being transcribed. Please wait.',
      }
    }

    // ── Validate URL ────────────────────────────────────────────────────────
    if (!isDirectMediaUrl(resource.url)) {
      return {
        success: false,
        error:
          'This URL is not a direct media file. YouTube watch links are not supported — ' +
          'please upload the video to Supabase Storage and update the resource URL.',
      }
    }

    if (!process.env['ELEVENLABS_API_KEY']) {
      return {
        success: false,
        error:
          'ElevenLabs is not configured. Add ELEVENLABS_API_KEY to your environment variables.',
      }
    }

    // ── Mark as processing ──────────────────────────────────────────────────
    const adminClient = createAdminClient()
    await adminClient
      .from('resources')
      .update({ transcript_status: 'processing' })
      .eq('id', resourceId)

    // ── Transcribe via ElevenLabs Scribe v2 ─────────────────────────────────
    let transcriptText: string
    try {
      const result = await transcribeFromUrl({ sourceUrl: resource.url })
      transcriptText = result.text
    } catch (err) {
      // Revert status on failure
      await adminClient
        .from('resources')
        .update({ transcript_status: 'failed' })
        .eq('id', resourceId)

      console.error('ElevenLabs transcription error:', err)
      return {
        success: false,
        error:
          err instanceof Error
            ? `Transcription failed: ${err.message}`
            : 'Transcription failed. Please try again.',
      }
    }

    // ── Generate AI summary from transcript ─────────────────────────────────
    const aiSummary = await generateSummaryFromTranscript(resource.title, transcriptText)
    const now = new Date().toISOString()

    // ── Persist transcript + summary ────────────────────────────────────────
    const updatePayload: Record<string, unknown> = {
      transcript: transcriptText,
      transcript_status: 'completed',
      transcript_generated_at: now,
    }

    if (aiSummary) {
      updatePayload.ai_summary = aiSummary
      updatePayload.ai_summary_generated_at = now
    }

    const { error: saveError } = await adminClient
      .from('resources')
      .update(updatePayload)
      .eq('id', resourceId)

    if (saveError) {
      console.error('Failed to save transcript:', saveError)
      return { success: false, error: 'Transcription succeeded but failed to save. Try again.' }
    }

    // ── Audit log ───────────────────────────────────────────────────────────
    const ctx = await getPermissionContext()
    if (ctx) {
      await adminClient.from('audit_log').insert({
        user_id: ctx.userId,
        action: 'transcribe_resource',
        entity_type: 'resources',
        entity_id: resourceId,
        new_value: {
          transcript_length: transcriptText.length,
          summary_generated: !!aiSummary,
        },
      })
    }

    // ── Revalidate ──────────────────────────────────────────────────────────
    revalidatePath('/resources')
    revalidatePath('/[chapter]/resources', 'page')

    return {
      success: true,
      data: { transcript: transcriptText, summaryGenerated: !!aiSummary },
      message: aiSummary
        ? 'Video transcribed and AI summary generated from transcript.'
        : 'Video transcribed successfully.',
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Transcription failed.',
    }
  }
}
