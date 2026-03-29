'use server'

import { generateObject, generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCoaches, CoachWithBasicProfile } from '@/features/coaches/queries/getCoaches'

export interface SmartMatchResult {
  coaches: CoachWithBasicProfile[]
  parsedFilters: {
    country?: string
    certification?: string
    semanticSearchQuery: string
    detectedLanguage: string
  }
  explanation: string
}

export async function smartMatchCoaches(query: string): Promise<SmartMatchResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  // Step 1: Parse the user query into structured filters and a semantic search term
  const { object: parsedQuery } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: z.object({
      country: z
        .string()
        .nullable()
        .optional()
        .describe(
          'A specific country name in English if explicitly mentioned (e.g. "Brazil", "Spain"). If only a city corresponds (like "Sao Paulo"), leave this empty and add to semanticSearchQuery.'
        ),
      certification: z
        .enum(['CALC', 'PALC', 'SALC', 'MALC', ''])
        .nullable()
        .optional()
        .describe('Action learning certification level explicitly mentioned.'),
      semanticSearchQuery: z
        .string()
        .describe(
          'The core problem, domain, or need to search for. E.g. "leadership manufacturing in Sao Paulo"'
        ),
      detectedLanguage: z
        .string()
        .describe('The ISO 639-1 language code of the user query, e.g. "en", "es", "pt", "de"'),
    }),
    prompt: `You are WIAL's AI coach matching assistant. Parse this user query to extract search parameters: "${query}"`,
  })

  // Step 2: Use the parsed semantic query and filters to get coaches
  const adminClient = createAdminClient()
  const { items: coaches } = await getCoaches(adminClient, {
    q: parsedQuery.semanticSearchQuery,
    country: parsedQuery.country || undefined,
    certification: parsedQuery.certification ? (parsedQuery.certification as any) : undefined,
    limit: 5,
  })

  if (coaches.length === 0) {
    const { text: noMatchExplanation } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `A user searched for coaches with this query: "${query}". We didn't find any exact matches based on those criteria. Give a polite, helpful 2-sentence response in the language "${parsedQuery.detectedLanguage}" suggesting they try a broader search or different keywords.`,
    })
    return {
      coaches: [],
      parsedFilters: parsedQuery,
      explanation: noMatchExplanation,
    }
  }

  // Step 3: Generate personalized explanations
  const coachDataForPrompt = coaches
    .map(
      (c, index) =>
        `Coach ${index + 1}: ${c.profile?.full_name} (Cert: ${c.certification_level}, Location: ${c.location_city || 'Unknown'}, ${c.location_country || 'Unknown'}, Match Score: ${Math.round((c.similarityScore || 0) * 100)}%)
     Specializations: ${(c.specializations || []).join(', ')}
     Bio snippet: ${c.bio?.substring(0, 150)}...
    `
    )
    .join('\n\n')

  const { text: explanation } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: `You are WIAL's intelligent coach matchmaker.
    
A user searched for: "${query}" (Language: ${parsedQuery.detectedLanguage}). 

We found these matching coaches in our database:
${coachDataForPrompt}

Task: Write a short, professional, and directly helpful response addressing the user in their language (language code: ${parsedQuery.detectedLanguage}). 
Explain concisely why these top coaches are a great fit for their specific request. Do NOT list the coaches bullet by bullet (the UI already does that). Just provide 2-3 sentences summarizing the collective expertise of these suggested coaches relative to the user's needs. Do not use markdown like bolding.`,
  })

  return {
    coaches,
    parsedFilters: parsedQuery,
    explanation,
  }
}
