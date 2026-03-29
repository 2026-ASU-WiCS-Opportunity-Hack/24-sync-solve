import { redirect } from 'next/navigation'

interface ChapterContactPageProps {
  params: Promise<{ chapter: string }>
}

export default async function ChapterContactPage({ params }: ChapterContactPageProps) {
  const { chapter: slug } = await params
  redirect(`/${slug}/about#contact`)
}
