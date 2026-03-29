'use server'
import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function searchKnowledge(query: string) {
  // Cast to untyped client until DB types are regenerated with new tables
  const supabase = (await createClient()) as unknown as SupabaseClient

  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: query,
  })

  // Semantic article search via pgvector RPC
  const { data: articles } = await supabase.rpc('search_articles', {
    query_embedding: embedding,
    match_threshold: 0.1,
    match_count: 5,
  })

  // Full-text search for coaches who specialise in related areas
  const { data: coaches } = await supabase
    .from('coach_profiles')
    .select(
      'user_id, bio, specializations, location_city, certification_level, profiles(full_name, avatar_url)'
    )
    .textSearch('search_vector', query, { type: 'websearch' })
    .eq('is_published', true)
    .limit(4)

  return { articles: articles ?? [], coaches: coaches ?? [] }
}
