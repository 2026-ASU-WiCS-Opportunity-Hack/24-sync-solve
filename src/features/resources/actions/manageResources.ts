'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  requirePermission,
  canPerformInChapter,
  getPermissionContext,
} from '@/lib/permissions/context'
import { analyzeResourceContent } from '@/features/knowledge/ai'
import { generateResourceMarketingAction } from '@/features/resources/actions/generateResourceAI'
import type { ActionResult } from '@/types'

interface CoachCourseMappingsTableAdapter {
  insert: (
    rows: Array<{ coach_profile_id: string; resource_id: string; created_by: string }>
  ) => Promise<{ error: { message: string } | null }>
  delete: () => {
    eq: (
      column: 'resource_id' | 'coach_profile_id',
      value: string
    ) => Promise<{ error: { message: string } | null }>
  }
}

interface CoachLookupRow {
  id: string
  profile: {
    full_name: string | null
  } | null
}

const resourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['video', 'article', 'pdf', 'link', 'webinar']),
  url: z.string().url('Must be a valid URL'),
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  category: z.string().max(50).optional(),
  is_published: z.boolean().default(true),
  raw_text: z.string().optional(),
  authors: z.array(z.string()).optional(),
  presenter: z.string().optional(),
  published_year: z.number().int().optional().nullable(),
})

export type ResourceFormData = z.infer<typeof resourceSchema>

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

async function syncCoachMappingsForResource(
  resourceId: string,
  createdBy: string,
  presenter: string | null | undefined,
  authors: string[] | null | undefined
) {
  const supabase = await createClient()

  const teacherNames = new Set<string>()
  if (presenter && presenter.trim()) teacherNames.add(normalizeName(presenter))
  for (const author of authors ?? []) {
    if (author.trim()) teacherNames.add(normalizeName(author))
  }

  const mappingTable = supabase.from(
    'coach_course_mappings' as never
  ) as unknown as CoachCourseMappingsTableAdapter

  // Reset existing mappings for this resource before re-linking.
  const { error: deleteError } = await mappingTable.delete().eq('resource_id', resourceId)
  if (deleteError) {
    // Mapping table may not exist yet in environments where migration was not applied.
    if (deleteError.message.toLowerCase().includes('coach_course_mappings')) return
    throw new Error(deleteError.message)
  }

  if (teacherNames.size === 0) return

  const { data: coachRows, error: coachError } = await supabase
    .from('coach_profiles')
    .select(
      `
      id,
      profile:profiles!coach_profiles_user_id_fkey (
        full_name
      )
    `
    )
    .eq('is_published', true)
    .eq('is_verified', true)

  if (coachError || !coachRows) return

  const matchedCoachIds = (coachRows as unknown as CoachLookupRow[])
    .filter((row) => {
      const fullName = row.profile?.full_name
      return fullName ? teacherNames.has(normalizeName(fullName)) : false
    })
    .map((row) => row.id)

  if (matchedCoachIds.length === 0) return

  const rows = matchedCoachIds.map((coachId) => ({
    coach_profile_id: coachId,
    resource_id: resourceId,
    created_by: createdBy,
  }))

  const { error: insertError } = await mappingTable.insert(rows)
  if (insertError) {
    if (insertError.message.toLowerCase().includes('coach_course_mappings')) return
    throw new Error(insertError.message)
  }
}

/** Require permission to manage resources — global role for null chapterId, chapter role otherwise. */
async function requireResourcePermission(
  chapterId: string | null,
  permission: 'content:create' | 'content:edit'
) {
  if (chapterId) {
    const ctx = await getPermissionContext()
    if (!ctx) throw new Error('Authentication required.')
    if (ctx.isSuspended) throw new Error('Your account is suspended.')
    if (!canPerformInChapter(ctx, chapterId, permission)) {
      throw new Error('You do not have permission to perform this action.')
    }
    return ctx
  }
  // Global resource — check global role
  return requirePermission(permission)
}

export async function createResourceAction(
  chapterId: string | null,
  formData: ResourceFormData
): Promise<ActionResult<null>> {
  try {
    const ctx = await requireResourcePermission(chapterId, 'content:create')
    const parsed = resourceSchema.parse(formData)
    const supabase = await createClient()

    let aiData = {}
    if (parsed.raw_text) {
      const analysis = await analyzeResourceContent(parsed.title, parsed.raw_text)
      aiData = {
        raw_text: parsed.raw_text,
        summary: analysis.summary,
        key_findings: analysis.key_findings,
        relevance_tags: analysis.relevance_tags,
        translations: analysis.translations,
        embedding: analysis.embedding,
      }
    } else if (parsed.description) {
      // Fallback: analyze description if no raw_text provided
      const analysis = await analyzeResourceContent(parsed.title, parsed.description)
      aiData = {
        summary: analysis.summary,
        key_findings: analysis.key_findings,
        relevance_tags: analysis.relevance_tags,
        translations: analysis.translations,
        embedding: analysis.embedding,
      }
    }

    const { data: createdResource, error } = await supabase
      .from('resources')
      .insert({
        title: parsed.title,
        description: parsed.description ?? null,
        type: parsed.type,
        url: parsed.url,
        thumbnail_url: parsed.thumbnail_url || null,
        category: parsed.category || null,
        is_published: parsed.is_published,
        chapter_id: chapterId,
        created_by: ctx.userId,
        authors: parsed.authors || null,
        presenter: parsed.presenter || null,
        published_year: parsed.published_year || null,
        ...aiData,
      } as any)
      .select('id')
      .single()

    if (error) throw new Error(error.message)

    if (createdResource?.id) {
      await syncCoachMappingsForResource(
        createdResource.id,
        ctx.userId,
        parsed.presenter,
        parsed.authors
      )
    }
    // Prefill AI summary + promoter cache at upload time so end users can open ready-made content.
    if (createdResource?.id) {
      await generateResourceMarketingAction(createdResource.id)
    }

    revalidatePath('/resources')
    revalidatePath('/resources/manage')
    return { success: true, data: null, message: 'Resource created.' }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create resource.',
    }
  }
}

export async function updateResourceAction(
  resourceId: string,
  chapterId: string | null,
  formData: ResourceFormData
): Promise<ActionResult<null>> {
  try {
    const ctx = await requireResourcePermission(chapterId, 'content:edit')
    const parsed = resourceSchema.parse(formData)
    const supabase = await createClient()

    let aiData = {}
    if (parsed.raw_text) {
      const analysis = await analyzeResourceContent(parsed.title, parsed.raw_text)
      aiData = {
        raw_text: parsed.raw_text,
        summary: analysis.summary,
        key_findings: analysis.key_findings,
        relevance_tags: analysis.relevance_tags,
        translations: analysis.translations,
        embedding: analysis.embedding,
      }
    }

    const { error } = await supabase
      .from('resources')
      .update({
        title: parsed.title,
        description: parsed.description ?? null,
        type: parsed.type,
        url: parsed.url,
        thumbnail_url: parsed.thumbnail_url || null,
        category: parsed.category || null,
        is_published: parsed.is_published,
        authors: parsed.authors || null,
        presenter: parsed.presenter || null,
        published_year: parsed.published_year || null,
        ai_summary: null,
        ai_summary_generated_at: null,
        ai_marketing: null,
        ai_marketing_generated_at: null,
        ...aiData,
      })
      .eq('id', resourceId)

    if (error) throw new Error(error.message)

    await syncCoachMappingsForResource(resourceId, ctx.userId, parsed.presenter, parsed.authors)

    revalidatePath('/resources')
    revalidatePath('/resources/manage')
    return { success: true, data: null, message: 'Resource updated.' }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update resource.',
    }
  }
}

export async function deleteResourceAction(
  resourceId: string,
  chapterId: string | null
): Promise<ActionResult<null>> {
  try {
    await requireResourcePermission(chapterId, 'content:edit')
    const supabase = await createClient()

    const { error } = await supabase.from('resources').delete().eq('id', resourceId)

    if (error) throw new Error(error.message)

    revalidatePath('/resources')
    revalidatePath('/resources/manage')
    return { success: true, data: null, message: 'Resource deleted.' }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete resource.',
    }
  }
}
