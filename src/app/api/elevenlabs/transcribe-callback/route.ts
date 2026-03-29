/**
 * POST /api/elevenlabs/transcribe-callback
 *
 * Receives the async webhook payload from ElevenLabs after a speech-to-text
 * job completes (when using the `webhook` parameter in the transcription request).
 *
 * Security: ElevenLabs signs every webhook with HMAC-SHA256.
 * We verify the `ElevenLabs-Signature` header against ELEVENLABS_WEBHOOK_SECRET.
 *
 * Docs: https://elevenlabs.io/docs/developer-guides/webhooks
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Signature verification ────────────────────────────────────────────────────

function verifyElevenLabsSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false

  // Header format: "t=<timestamp>,v1=<hex-signature>"
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [k, ...v] = part.split('=')
      return [k, v.join('=')]
    })
  )

  const timestamp = parts['t']
  const signature = parts['v1']
  if (!timestamp || !signature) return false

  // Reject if timestamp is more than 5 minutes old (replay attack prevention)
  const age = Date.now() / 1000 - Number(timestamp)
  if (age > 300) return false

  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    return false
  }
}

// ── Claude summary helper ─────────────────────────────────────────────────────

async function generateSummaryFromTranscript(
  title: string,
  transcript: string
): Promise<string | null> {
  const apiKey = process.env['ANTHROPIC_API_KEY']
  if (!apiKey) return null

  try {
    const client = new Anthropic({ apiKey })
    const truncated =
      transcript.length > 12000
        ? transcript.slice(0, 12000) + '\n\n[transcript truncated]'
        : transcript

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system:
        'You are summarising educational content for WIAL. Write a concise plain-language summary in 3–4 sentences. No bullets or markdown.',
      messages: [{ role: 'user', content: `Title: ${title}\n\nTranscript:\n${truncated}` }],
    })

    return message.content[0]?.type === 'text' ? message.content[0].text.trim() : null
  } catch (err) {
    console.error('Claude summary error in webhook handler:', err)
    return null
  }
}

// ── Webhook payload types ─────────────────────────────────────────────────────

interface ElevenLabsWebhookWord {
  text: string
  start?: number
  end?: number
  type?: string
}

interface ElevenLabsWebhookPayload {
  type: 'speech_to_text.completed' | 'speech_to_text.failed' | string
  data?: {
    transcript_id?: string
    text?: string
    words?: ElevenLabsWebhookWord[]
    language_code?: string
    status?: string
    error?: string
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env['ELEVENLABS_WEBHOOK_SECRET']
  if (!webhookSecret) {
    console.error('ELEVENLABS_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const rawBody = await req.text()
  const signatureHeader = req.headers.get('ElevenLabs-Signature')

  if (!verifyElevenLabsSignature(rawBody, signatureHeader, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: ElevenLabsWebhookPayload
  try {
    payload = JSON.parse(rawBody) as ElevenLabsWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const transcriptJobId = payload.data?.transcript_id

  if (!transcriptJobId) {
    // Nothing to match — acknowledge and ignore
    return NextResponse.json({ received: true })
  }

  // ── Find the resource matching this job id ────────────────────────────────
  const { data: resource } = await adminClient
    .from('resources')
    .select('id, title, transcript_job_id')
    .eq('transcript_job_id', transcriptJobId)
    .single()

  if (!resource) {
    // Job not linked to any resource — possibly a manual/test call
    return NextResponse.json({ received: true })
  }

  // ── Handle completion ─────────────────────────────────────────────────────
  if (payload.type === 'speech_to_text.completed' && payload.data?.text) {
    const transcriptText = payload.data.text
    const now = new Date().toISOString()

    const aiSummary = await generateSummaryFromTranscript(resource.title, transcriptText)

    const updatePayload: Record<string, unknown> = {
      transcript: transcriptText,
      transcript_status: 'completed',
      transcript_generated_at: now,
      transcript_job_id: null, // clear once done
    }

    if (aiSummary) {
      updatePayload.ai_summary = aiSummary
      updatePayload.ai_summary_generated_at = now
    }

    await adminClient.from('resources').update(updatePayload).eq('id', resource.id)

    await adminClient.from('audit_log').insert({
      user_id: null,
      action: 'transcribe_resource_webhook',
      entity_type: 'resources',
      entity_id: resource.id,
      new_value: {
        transcript_length: transcriptText.length,
        summary_generated: !!aiSummary,
        source: 'elevenlabs_webhook',
      },
    })
  } else if (payload.type === 'speech_to_text.failed') {
    await adminClient
      .from('resources')
      .update({ transcript_status: 'failed', transcript_job_id: null })
      .eq('id', resource.id)

    console.error(
      `ElevenLabs transcription failed for resource ${resource.id}:`,
      payload.data?.error
    )
  }

  return NextResponse.json({ received: true })
}
