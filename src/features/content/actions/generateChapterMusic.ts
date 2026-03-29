'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPermissionContext, canPerformInChapter } from '@/lib/permissions/context'
import { generateBackgroundMusic } from '@/lib/elevenlabs/soundGeneration'
import type { ActionResult, Json } from '@/types'

// ── Input schema ─────────────────────────────────────────────────────────────

const generateChapterMusicSchema = z.object({
  chapter_id: z.string().uuid(),
  music_prompt: z
    .string()
    .min(10, 'Please describe the music vibe in at least 10 characters.')
    .max(300, 'Prompt must be 300 characters or less.'),
  duration_seconds: z.number().int().min(5).max(30).optional().default(20),
  enabled: z.boolean().optional().default(true),
})

export type GenerateChapterMusicInput = z.infer<typeof generateChapterMusicSchema>

export interface ChapterMusicResult {
  musicUrl: string
  chapterSlug: string
}

/**
 * Server action: generate background music for a chapter using ElevenLabs
 * Sound Generation, upload it to Supabase Storage (chapter-assets bucket),
 * and persist the URL + metadata in chapters.settings under the key
 * "background_music".
 *
 * Permission: chapter_lead or super_admin for the given chapter.
 */
export async function generateChapterMusicAction(
  _prevState: ActionResult<ChapterMusicResult> | null,
  formData: FormData
): Promise<ActionResult<ChapterMusicResult>> {
  // ── Parse & validate ──────────────────────────────────────────────────────
  const raw = {
    chapter_id: formData.get('chapter_id') as string,
    music_prompt: formData.get('music_prompt') as string,
    duration_seconds: formData.get('duration_seconds')
      ? Number(formData.get('duration_seconds'))
      : undefined,
    enabled: formData.get('enabled') !== 'false',
  }

  const result = generateChapterMusicSchema.safeParse(raw)
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const [key, issues] of Object.entries(result.error.flatten().fieldErrors)) {
      if (issues) fieldErrors[key] = issues
    }
    return { success: false, error: 'Please fix the errors below.', fieldErrors }
  }

  const input = result.data

  // ── Auth ──────────────────────────────────────────────────────────────────
  const ctx = await getPermissionContext()
  if (!ctx) return { success: false, error: 'Authentication required.' }
  if (ctx.isSuspended) return { success: false, error: 'Your account is suspended.' }

  const canGenerate =
    ctx.globalRole === 'super_admin' || canPerformInChapter(ctx, input.chapter_id, 'content:edit')

  if (!canGenerate) return { success: false, error: 'Permission denied.' }

  // ── Fetch chapter ─────────────────────────────────────────────────────────
  const adminClient = createAdminClient()

  const { data: chapter } = await adminClient
    .from('chapters')
    .select('id, slug, settings')
    .eq('id', input.chapter_id)
    .single()

  if (!chapter) return { success: false, error: 'Chapter not found.' }

  // ── Check ElevenLabs key is configured ───────────────────────────────────
  if (!process.env['ELEVENLABS_API_KEY']) {
    return {
      success: false,
      error: 'ElevenLabs is not configured. Add ELEVENLABS_API_KEY to your environment variables.',
    }
  }

  // ── Generate music via ElevenLabs ─────────────────────────────────────────
  let audioBuffer: Buffer
  try {
    const generated = await generateBackgroundMusic({
      prompt: input.music_prompt,
      durationSeconds: input.duration_seconds,
      promptInfluence: 0.4,
    })
    audioBuffer = generated.buffer
  } catch (err) {
    console.error('ElevenLabs sound generation error:', err)
    return {
      success: false,
      error:
        err instanceof Error
          ? `Music generation failed: ${err.message}`
          : 'Music generation failed. Please try again.',
    }
  }

  // ── Upload to Supabase Storage ─────────────────────────────────────────────
  const storagePath = `${chapter.slug}/background-music.mp3`

  const { error: uploadError } = await adminClient.storage
    .from('chapter-assets')
    .upload(storagePath, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true, // overwrite previous music for this chapter
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return { success: false, error: 'Failed to save audio file. Please try again.' }
  }

  // ── Build public URL ──────────────────────────────────────────────────────
  const { data: urlData } = adminClient.storage.from('chapter-assets').getPublicUrl(storagePath)

  const musicUrl = urlData.publicUrl

  // ── Persist in chapters.settings JSONB ────────────────────────────────────
  const existingSettings =
    chapter.settings && typeof chapter.settings === 'object' && !Array.isArray(chapter.settings)
      ? (chapter.settings as Record<string, Json>)
      : {}

  const updatedSettings: Record<string, Json> = {
    ...existingSettings,
    background_music: {
      url: musicUrl,
      prompt: input.music_prompt,
      enabled: input.enabled,
      duration_seconds: input.duration_seconds,
      generated_at: new Date().toISOString(),
    },
  }

  const { error: updateError } = await adminClient
    .from('chapters')
    .update({ settings: updatedSettings as Json, updated_at: new Date().toISOString() })
    .eq('id', input.chapter_id)

  if (updateError) {
    console.error('Chapter settings update error:', updateError)
    return { success: false, error: 'Music generated but failed to save settings.' }
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  await adminClient.from('audit_log').insert({
    user_id: ctx.userId,
    action: 'generate_chapter_music',
    entity_type: 'chapters',
    entity_id: chapter.id,
    new_value: {
      prompt: input.music_prompt,
      duration_seconds: input.duration_seconds,
      music_url: musicUrl,
    } as Json,
  })

  // ── Revalidate chapter pages ──────────────────────────────────────────────
  revalidatePath(`/${chapter.slug}`, 'layout')

  return {
    success: true,
    data: { musicUrl, chapterSlug: chapter.slug },
    message: 'Background music generated and saved. It will play on the chapter site.',
  }
}

/**
 * Server action: toggle whether background music is enabled for a chapter.
 * Does not regenerate — just flips the flag in chapters.settings.
 */
export async function toggleChapterMusicAction(
  chapterId: string,
  enabled: boolean
): Promise<ActionResult<null>> {
  const ctx = await getPermissionContext()
  if (!ctx) return { success: false, error: 'Authentication required.' }
  if (ctx.isSuspended) return { success: false, error: 'Your account is suspended.' }

  const canEdit =
    ctx.globalRole === 'super_admin' || canPerformInChapter(ctx, chapterId, 'content:edit')

  if (!canEdit) return { success: false, error: 'Permission denied.' }

  const adminClient = createAdminClient()

  const { data: chapter } = await adminClient
    .from('chapters')
    .select('id, slug, settings')
    .eq('id', chapterId)
    .single()

  if (!chapter) return { success: false, error: 'Chapter not found.' }

  const existingSettings =
    chapter.settings && typeof chapter.settings === 'object' && !Array.isArray(chapter.settings)
      ? (chapter.settings as Record<string, Json>)
      : {}

  const existingMusic =
    existingSettings.background_music &&
    typeof existingSettings.background_music === 'object' &&
    !Array.isArray(existingSettings.background_music)
      ? (existingSettings.background_music as Record<string, Json>)
      : null

  if (!existingMusic) {
    return { success: false, error: 'No background music has been generated for this chapter.' }
  }

  const updatedSettings: Record<string, Json> = {
    ...existingSettings,
    background_music: { ...existingMusic, enabled },
  }

  const { error } = await adminClient
    .from('chapters')
    .update({ settings: updatedSettings as Json, updated_at: new Date().toISOString() })
    .eq('id', chapterId)

  if (error) return { success: false, error: 'Failed to update music settings.' }

  revalidatePath(`/${chapter.slug}`, 'layout')

  return {
    success: true,
    data: null,
    message: enabled ? 'Background music enabled.' : 'Background music disabled.',
  }
}
