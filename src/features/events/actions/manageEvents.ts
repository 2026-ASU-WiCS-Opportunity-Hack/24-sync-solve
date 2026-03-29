'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { eventCreateSchema, eventUpdateSchema, uuidSchema } from '@/lib/utils/validation'
import type { ActionResult, Event } from '@/types'
import type { Json } from '@/types/database'

/**
 * Verify the current user is a chapter_lead or content_editor for the given chapter,
 * or a super_admin.
 * Returns { userId, role, chapterId } on success, or throws redirect.
 */
async function requireChapterAccess(chapterId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, chapter_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { success: false as const, error: 'Profile not found.' }
  }

  const isSuperAdmin = profile.role === 'super_admin'
  const isChapterLead = profile.role === 'chapter_lead' && profile.chapter_id === chapterId
  const isContentEditor = profile.role === 'content_editor' && profile.chapter_id === chapterId

  // Also check user_chapter_roles for multi-chapter assignments
  if (!isSuperAdmin && !isChapterLead && !isContentEditor) {
    const { data: chapterRole } = await supabase
      .from('user_chapter_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('chapter_id', chapterId)
      .in('role', ['chapter_lead', 'content_editor'])
      .single()

    if (!chapterRole) {
      return { success: false as const, error: 'Insufficient permissions for this chapter.' }
    }
  }

  return { success: true as const, userId: user.id }
}

/**
 * Server action: create a new event for a chapter.
 * Requires chapter_lead, content_editor, or super_admin role.
 */
export async function createEventAction(
  chapterId: string,
  _prevState: ActionResult<Event> | null,
  formData: FormData
): Promise<ActionResult<Event>> {
  const access = await requireChapterAccess(chapterId)
  if (!access.success) {
    return { success: false, error: access.error }
  }

  const raw = {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || '',
    event_type: formData.get('event_type') as string,
    start_date: formData.get('start_date') as string,
    end_date: (formData.get('end_date') as string) || '',
    timezone: formData.get('timezone') as string,
    location_name: (formData.get('location_name') as string) || '',
    is_virtual: formData.get('is_virtual') as string,
    virtual_link: (formData.get('virtual_link') as string) || '',
    max_attendees: (formData.get('max_attendees') as string) || '',
    registration_url: (formData.get('registration_url') as string) || '',
    image_url: (formData.get('image_url') as string) || '',
    is_published: formData.get('is_published') as string,
  }

  const result = eventCreateSchema.safeParse(raw)
  if (!result.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const adminClient = createAdminClient()

  const { data: event, error } = await adminClient
    .from('events')
    .insert({ ...result.data, chapter_id: chapterId })
    .select()
    .single()

  if (error || !event) {
    console.error('Event create error:', error)
    return { success: false, error: 'Failed to create event. Please try again.' }
  }

  // Audit log
  await adminClient.from('audit_log').insert({
    user_id: access.userId,
    action: 'create',
    entity_type: 'event',
    entity_id: event.id,
    chapter_id: chapterId,
    new_value: event as unknown as Json,
  })

  revalidatePath(`/events`)
  revalidatePath(`/[chapter]/events`)

  return {
    success: true,
    data: event,
    message: `Event "${event.title}" created successfully.`,
  }
}

/**
 * Server action: update an existing chapter event.
 * Requires chapter_lead, content_editor, or super_admin role.
 */
export async function updateEventAction(
  chapterId: string,
  _prevState: ActionResult<Event> | null,
  formData: FormData
): Promise<ActionResult<Event>> {
  const access = await requireChapterAccess(chapterId)
  if (!access.success) {
    return { success: false, error: access.error }
  }

  const eventIdRaw = formData.get('id') as string
  const eventIdResult = uuidSchema.safeParse(eventIdRaw)
  if (!eventIdResult.success) {
    return { success: false, error: 'Invalid event ID.' }
  }

  const raw = {
    id: eventIdResult.data,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || '',
    event_type: formData.get('event_type') as string,
    start_date: formData.get('start_date') as string,
    end_date: (formData.get('end_date') as string) || '',
    timezone: formData.get('timezone') as string,
    location_name: (formData.get('location_name') as string) || '',
    is_virtual: formData.get('is_virtual') as string,
    virtual_link: (formData.get('virtual_link') as string) || '',
    max_attendees: (formData.get('max_attendees') as string) || '',
    registration_url: (formData.get('registration_url') as string) || '',
    image_url: (formData.get('image_url') as string) || '',
    is_published: formData.get('is_published') as string,
  }

  const result = eventUpdateSchema.safeParse(raw)
  if (!result.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { id, ...updateData } = result.data

  const supabase = await createClient()

  // Verify the event belongs to this chapter
  const { data: existing } = await supabase
    .from('events')
    .select('id, chapter_id')
    .eq('id', id)
    .eq('chapter_id', chapterId)
    .single()

  if (!existing) {
    return { success: false, error: 'Event not found or not in this chapter.' }
  }

  const { data: event, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error || !event) {
    console.error('Event update error:', error)
    return { success: false, error: 'Failed to update event. Please try again.' }
  }

  revalidatePath(`/events`)
  revalidatePath(`/events/${id}`)
  revalidatePath(`/[chapter]/events`)

  return {
    success: true,
    data: event,
    message: `Event "${event.title}" updated successfully.`,
  }
}

/**
 * Server action: delete a chapter event.
 * Requires chapter_lead, content_editor, or super_admin role.
 */
export async function deleteEventAction(chapterId: string, eventId: string): Promise<ActionResult> {
  const access = await requireChapterAccess(chapterId)
  if (!access.success) {
    return { success: false, error: access.error }
  }

  const eventIdResult = uuidSchema.safeParse(eventId)
  if (!eventIdResult.success) {
    return { success: false, error: 'Invalid event ID.' }
  }

  const supabase = await createClient()

  // Verify ownership
  const { data: existing } = await supabase
    .from('events')
    .select('id, title')
    .eq('id', eventId)
    .eq('chapter_id', chapterId)
    .single()

  if (!existing) {
    return { success: false, error: 'Event not found or not in this chapter.' }
  }

  const { error } = await supabase.from('events').delete().eq('id', eventId)

  if (error) {
    console.error('Event delete error:', error)
    return { success: false, error: 'Failed to delete event. Please try again.' }
  }

  // Audit log
  const adminClient = createAdminClient()
  await adminClient.from('audit_log').insert({
    user_id: access.userId,
    action: 'delete',
    entity_type: 'event',
    entity_id: eventId,
    chapter_id: chapterId,
    old_value: existing as unknown as Json,
  })

  revalidatePath(`/events`)
  revalidatePath(`/[chapter]/events`)

  return {
    success: true,
    data: null,
    message: `Event "${existing.title}" deleted successfully.`,
  }
}
