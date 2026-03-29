import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

export interface CompletionDetail {
  resource_id: string
  completed_at: string
  expires_at: string
}

/**
 * Returns the set of resource IDs the user has completed that are not yet expired.
 * Empty set for unauthenticated users or on error.
 */
export async function getUserCompletions(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Set<string>> {
  const now = new Date().toISOString()
  const { data } = await supabase
    .from('resource_completions')
    .select('resource_id')
    .eq('user_id', userId)
    .gt('expires_at', now)

  if (!data) return new Set()
  return new Set(data.map((r) => r.resource_id as string))
}

/**
 * Returns full completion detail rows for the user (non-expired only).
 * Useful for the profile page to show expiry dates.
 */
export async function getUserCompletionDetails(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CompletionDetail[]> {
  const now = new Date().toISOString()
  const { data } = await supabase
    .from('resource_completions')
    .select('resource_id, completed_at, expires_at')
    .eq('user_id', userId)
    .gt('expires_at', now)
    .order('completed_at', { ascending: false })

  return (data ?? []) as CompletionDetail[]
}
