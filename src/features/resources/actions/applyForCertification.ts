'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'
import type { CertificationLevel } from '@/features/resources/types'

const levelSchema = z.enum(['CALC', 'PALC', 'SALC', 'MALC'])

/**
 * Submit a certification application for the current user.
 *
 * Guards:
 *  1. User must be authenticated and not suspended.
 *  2. No existing pending_approval or active approved cert for this level.
 *  3. All required resources for the level must be non-expired-completed.
 */
export async function applyForCertificationAction(
  level: CertificationLevel
): Promise<ActionResult<null>> {
  try {
    const parsedLevel = levelSchema.parse(level)
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Authentication required.' }

    // Check profile is not suspended
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_suspended')
      .eq('id', user.id)
      .single()

    if (profile?.is_suspended) {
      return { success: false, error: 'Your account is suspended.' }
    }

    const now = new Date().toISOString()

    // Guard: no active cert for this level
    const { data: existingCerts } = await supabase
      .from('user_certifications')
      .select('id, status, expires_at')
      .eq('user_id', user.id)
      .eq('level', parsedLevel)
      .order('applied_at', { ascending: false })
      .limit(1)

    const latest = existingCerts?.[0]
    if (latest) {
      if (latest.status === 'pending_approval') {
        return { success: false, error: 'You already have a pending application for this level.' }
      }
      if (latest.status === 'approved' && (latest.expires_at === null || latest.expires_at > now)) {
        return { success: false, error: 'You are already certified at this level.' }
      }
    }

    // Guard: all required resources completed (re-validate server-side)
    const [requirementsResult, completionsResult] = await Promise.all([
      supabase
        .from('certification_requirements')
        .select('resource_id')
        .eq('level', parsedLevel)
        .eq('is_required', true),
      supabase
        .from('resource_completions')
        .select('resource_id')
        .eq('user_id', user.id)
        .gt('expires_at', now),
    ])

    const requiredIds = (requirementsResult.data ?? []).map((r) => r.resource_id as string)
    const completedIds = new Set((completionsResult.data ?? []).map((c) => c.resource_id as string))

    if (requiredIds.length === 0) {
      return {
        success: false,
        error: 'No requirements have been defined for this certification level yet.',
      }
    }

    const incomplete = requiredIds.filter((id) => !completedIds.has(id))
    if (incomplete.length > 0) {
      return {
        success: false,
        error: `You have ${incomplete.length} required resource${incomplete.length !== 1 ? 's' : ''} not yet completed.`,
      }
    }

    // Submit application
    const { error } = await supabase.from('user_certifications').insert({
      user_id: user.id,
      level: parsedLevel,
      status: 'pending_approval',
    })

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard')
    revalidatePath('/coaches/profile')

    return {
      success: true,
      data: null,
      message: `Your application for ${parsedLevel} certification has been submitted for review.`,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit certification application.',
    }
  }
}
