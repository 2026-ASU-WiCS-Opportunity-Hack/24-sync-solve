'use server'
import { generateText, embed } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from '@/lib/utils/serverAuth'

const pdfParse = require('pdf-parse/lib/pdf-parse.js')

export async function uploadArticle(formData: FormData) {
  const role = await getCurrentUserRole()
  if (role !== 'super_admin' && role !== 'content_editor') throw new Error('Unauthorized')

  const supabase = await createClient()

  const file = formData.get('pdf') as File
  const title = formData.get('title') as string
  const buffer = Buffer.from(await file.arrayBuffer())

  // Upload PDF to Storage
  const path = `articles/${Date.now()}-${file.name}`
  await supabase.storage
    .from('article-pdfs')
    .upload(path, buffer, { contentType: 'application/pdf' })
  const { data: urlData } = supabase.storage.from('article-pdfs').getPublicUrl(path)

  // Extract text
  const { text: rawText } = await pdfParse(buffer)
  const excerpt = rawText.slice(0, 12000) // stay within token budget

  // AI: summary + findings + tags + translations
  const { text: aiOutput } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: `Analyze this Action Learning article and return ONLY valid JSON:
{
  "summary": "3-sentence plain-language summary",
  "key_findings": [{ "finding": "string", "tags": ["tag"] }],
  "relevance_tags": ["healthcare","leadership","government","manufacturing","education","team-performance","employee-retention","nonprofit","finance","technology","coaching","diversity"],
  "translations": { "es": { "summary": "..." }, "pt": { "summary": "..." }, "fr": { "summary": "..." } }
}
Title: ${title}
Text: ${excerpt}`,
  })
  const cleanOutput = aiOutput
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/g, '')
    .trim()
  const parsed = JSON.parse(cleanOutput)

  // Embed for semantic search
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: `${title} ${parsed.summary} ${parsed.relevance_tags.join(' ')}`,
  })

  const { data, error } = await supabase
    .from('journal_articles')
    .insert({
      title,
      raw_text: excerpt,
      pdf_url: urlData.publicUrl,
      embedding,
      is_published: true,
      ...parsed,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return { success: true, article: data }
}
