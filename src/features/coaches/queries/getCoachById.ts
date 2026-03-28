'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

export interface CoachFullProfile {
  id: string
  user_id: string
  chapter_id: string | null
  certification_level: string
  bio: string | null
  specializations: string[]
  languages: string[]
  location_city: string | null
  location_country: string | null
  photo_url: string | null
  contact_email: string | null
  linkedin_url: string | null
  is_published: boolean
  is_verified: boolean
  certification_date: string | null
  recertification_due: string | null
  coaching_hours: number | null
  created_at: string
  updated_at: string
  profile: {
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null
  chapter: {
    id: string
    name: string
    slug: string
    accent_color: string | null
  } | null
}

/**
 * Fetch a single published coach profile by their coach_profiles.id.
 * Used for the public coach profile page.
 */
export async function getCoachById(
  supabase: SupabaseClient<Database>,
  coachId: string
): Promise<CoachFullProfile | null> {
  const { data, error } = await supabase
    .from('coach_profiles')
    .select(
      `
      *,
      profile:profiles!coach_profiles_user_id_fkey (
        full_name,
        email,
        avatar_url
      ),
      chapter:chapters!coach_profiles_chapter_id_fkey (
        id,
        name,
        slug,
        accent_color
      )
    `
    )
    .eq('id', coachId)
    .eq('is_published', true)
    .single()

  if (error || !data) return null
  return data as unknown as CoachFullProfile
}

/**
 * Fetch a coach profile by user_id (for the coach's own profile management).
 * Does NOT filter by is_published — coaches can see their own unpublished profile.
 */
export async function getCoachProfileByUserId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CoachFullProfile | null> {
  const { data, error } = await supabase
    .from('coach_profiles')
    .select(
      `
      *,
      profile:profiles!coach_profiles_user_id_fkey (
        full_name,
        email,
        avatar_url
      ),
      chapter:chapters!coach_profiles_chapter_id_fkey (
        id,
        name,
        slug,
        accent_color
      )
    `
    )
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data as unknown as CoachFullProfile
}
