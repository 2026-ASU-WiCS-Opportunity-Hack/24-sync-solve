'use server'
import { generateText, embed } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from '@/lib/utils/serverAuth'
import type { AiModelProvider } from '@/features/knowledge/types'
import type { SupabaseClient } from '@supabase/supabase-js'

// pdf-parse CommonJS shim — avoids the Next.js instrumentation import issue
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (
  buffer: Buffer
) => Promise<{ text: string }>

const SUMMARIZE_PROMPT = (title: string, excerpt: string) =>
  `Analyze this Action Learning article and return ONLY valid JSON:
{
  "summary": "3-sentence plain-language summary",
  "key_findings": [{ "finding": "string", "tags": ["tag"] }],
  "relevance_tags": ["healthcare","leadership","government","manufacturing","education","team-performance","employee-retention","nonprofit","finance","technology","coaching","diversity"],
  "translations": { "es": { "summary": "..." }, "pt": { "summary": "..." }, "fr": { "summary": "..." } }
}
Title: ${title}
Text: ${excerpt}`

export async function uploadArticle(
  formData: FormData,
  modelProvider: AiModelProvider = 'claude'
) {
  const role = await getCurrentUserRole()
  if (role !== 'super_admin' && role !== 'content_editor') throw new Error('Unauthorized')

  const supabase = (await createClient()) as unknown as SupabaseClient

  const file = formData.get('pdf') as File
  const title = formData.get('title') as string
  const authors = formData.get('authors') as string
  const publishedYear = formData.get('publishedYear') as string

  const buffer = Buffer.from(await file.arrayBuffer())

  // Upload PDF to Storage
  const path = `articles/${Date.now()}-${file.name}`
  await supabase.storage
    .from('article-pdfs')
    .upload(path, buffer, { contentType: 'application/pdf' })
  const { data: urlData } = supabase.storage.from('article-pdfs').getPublicUrl(path)

  // Extract text from PDF
  const { text: rawText } = await pdfParse(buffer)
  const excerpt = rawText.slice(0, 12000) // ~3 000 tokens — well within GPT-4o (128 K) and Claude (200 K) limits

  // AI: summary + findings + tags + translations
  // Supports Claude (claude-3-5-sonnet) or GPT-4o
  const model =
    modelProvider === 'claude'
      ? anthropic('claude-3-5-sonnet-20241022')
      : openai('gpt-4o')

  const { text: aiOutput } = await generateText({
    model,
    prompt: SUMMARIZE_PROMPT(title, excerpt),
  })

  const cleanOutput = aiOutput
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/g, '')
    .trim()
  const parsed = JSON.parse(cleanOutput) as {
    summary: string
    key_findings: { finding: string; tags: string[] }[]
    relevance_tags: string[]
    translations: { es?: { summary: string }; pt?: { summary: string }; fr?: { summary: string } }
  }

  // Embed for semantic search using OpenAI text-embedding-3-small
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: `${title} ${parsed.summary} ${parsed.relevance_tags.join(' ')}`,
  })

  const { data, error } = await supabase
    .from('journal_articles')
    .insert({
      title,
      authors: authors
        ? authors
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean)
        : [],
      published_year: publishedYear ? parseInt(publishedYear, 10) : null,
      raw_text: excerpt,
      pdf_url: urlData.publicUrl,
      embedding,
      is_published: true,
      ...parsed,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return { success: true, article: data, modelUsed: modelProvider }
}
