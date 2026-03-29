import { generateText, embed } from 'ai'
import { openai } from '@ai-sdk/openai'

export interface AIAnalysisResult {
  summary: string
  key_findings: Array<{ finding: string; tags: string[] }>
  relevance_tags: string[]
  translations: Record<string, { summary: string }>
  embedding: number[]
}

/**
 * Analyzes text content using AI to generate a summary, key findings, tags, and embeddings.
 */
export async function analyzeResourceContent(
  title: string,
  content: string
): Promise<AIAnalysisResult> {
  const excerpt = content.slice(0, 12000) // stay within token budget

  // AI Analysis: Summary + findings + tags + translations
  const { text: aiOutput } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: `Analyze this content related to Action Learning and return ONLY valid JSON:
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

  // Generate embedding for semantic search
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: `${title} ${parsed.summary} ${parsed.relevance_tags.join(' ')}`,
  })

  return {
    ...parsed,
    embedding,
  }
}
