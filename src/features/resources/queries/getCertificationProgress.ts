import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types'
import type {
  CertificationLevel,
  CertificationProgress,
  CertificationRequirement,
  UserCertification,
} from '@/features/resources/types'
import { CERTIFICATION_LEVEL_ORDER } from '@/features/resources/types'

/**
 * Compute certification progress for all four levels for a given user.
 * Returns an entry for every level even if no requirements are defined.
 */
export async function getCertificationProgress(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CertificationProgress[]> {
  const now = new Date().toISOString()

  // Parallel fetch: requirements, non-expired completions, certifications
  const [requirementsResult, completionsResult, certsResult] = await Promise.all([
    supabase
      .from('certification_requirements')
      .select('level, resource_id, is_required')
      .eq('is_required', true),
    supabase
      .from('resource_completions')
      .select('resource_id')
      .eq('user_id', userId)
      .gt('expires_at', now),
    supabase
      .from('user_certifications')
      .select('id, user_id, level, status, applied_at, approved_at, approved_by, expires_at, notes')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false }),
  ])

  const requirements = (requirementsResult.data ?? []) as CertificationRequirement[]
  const completedIds = new Set((completionsResult.data ?? []).map((c) => c.resource_id as string))
  const certifications = (certsResult.data ?? []) as UserCertification[]

  // Group requirements by level
  const byLevel = new Map<CertificationLevel, string[]>()
  for (const level of CERTIFICATION_LEVEL_ORDER) {
    byLevel.set(level, [])
  }
  for (const req of requirements) {
    const list = byLevel.get(req.level as CertificationLevel)
    if (list) list.push(req.resource_id)
  }

  // Latest cert per level (first in the ordered result since ordered DESC)
  const latestCert = new Map<CertificationLevel, UserCertification>()
  for (const cert of certifications) {
    if (!latestCert.has(cert.level)) {
      latestCert.set(cert.level, cert)
    }
  }

  return CERTIFICATION_LEVEL_ORDER.map((level) => {
    const requiredIds = byLevel.get(level) ?? []
    const totalRequired = requiredIds.length
    const completedRequired = requiredIds.filter((id) => completedIds.has(id)).length
    const isComplete = totalRequired > 0 && completedRequired === totalRequired
    const existing = latestCert.get(level) ?? null

    // Cannot apply if: not complete, already has pending/approved non-expired cert
    const hasActiveCert =
      existing !== null &&
      (existing.status === 'pending_approval' ||
        (existing.status === 'approved' &&
          (existing.expires_at === null || existing.expires_at > now)))

    const canApply = isComplete && !hasActiveCert

    return {
      level,
      totalRequired,
      completedRequired,
      percentage: totalRequired === 0 ? 0 : Math.round((completedRequired / totalRequired) * 100),
      isComplete,
      canApply,
      existing,
    }
  })
}
