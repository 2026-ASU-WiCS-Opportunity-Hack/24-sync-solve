import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

/**
 * Fetch one or more global settings by key.
 * Returns a map of key → value for all matching rows.
 * Missing keys are absent from the returned object (caller provides defaults).
 */
export async function getGlobalSettings(
  supabase: SupabaseClient<Database>,
  keys: string[]
): Promise<Record<string, string>> {
  const { data } = await supabase.from('global_settings').select('key, value').in('key', keys)

  if (!data) return {}
  return Object.fromEntries(data.map((row) => [row.key, row.value]))
}
