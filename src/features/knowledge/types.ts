export type KnowledgeTranslation = {
  es?: { summary: string }
  pt?: { summary: string }
  fr?: { summary: string }
}

export type JournalArticle = {
  id: string
  title: string
  authors: string[]
  published_year: number
  source_url?: string
  pdf_url?: string
  raw_text?: string
  summary?: string
  key_findings?: { finding: string; tags: string[] }[]
  relevance_tags: string[]
  translations?: KnowledgeTranslation
  is_published: boolean
  created_at: string
}

export type Webinar = {
  id: string
  title: string
  description?: string
  presenter?: string
  scheduled_at?: string
  recording_url?: string
  chapter_id?: string
  marketing?: {
    linkedin_post: string
    email_subject: string
    email_body: string
    content_outline: { timecode: string; segment: string }[]
  }
  is_published: boolean
}
