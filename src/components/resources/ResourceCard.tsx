import Image from 'next/image'
import { Play, FileText, FileDown, ExternalLink } from 'lucide-react'
import {
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_COLORS,
  getYouTubeThumbnail,
} from '@/features/resources/types'
import { ResourceCardClient } from '@/components/resources/ResourceCardClient'
import { ResourceAIControls } from '@/components/resources/ResourceAIControls'
import type { Resource } from '@/features/resources/types'

interface ResourceCardProps {
  resource: Resource
  canGenerateAI?: boolean
  /** Pass true/false when the user is authenticated to show the completion badge. */
  isCompleted?: boolean
}

type ResourceDisplayType = 'video' | 'article' | 'pdf' | 'link' | 'webinar'

const TYPE_ICONS: Record<ResourceDisplayType, typeof Play> = {
  video: Play,
  article: FileText,
  pdf: FileDown,
  link: ExternalLink,
  webinar: Play,
}

const TYPE_LABELS: Record<ResourceDisplayType, string> = {
  video: RESOURCE_TYPE_LABELS.video,
  article: RESOURCE_TYPE_LABELS.article,
  pdf: RESOURCE_TYPE_LABELS.pdf,
  link: RESOURCE_TYPE_LABELS.link,
  webinar: 'Webinar',
}

const TYPE_COLORS: Record<ResourceDisplayType, string> = {
  video: RESOURCE_TYPE_COLORS.video,
  article: RESOURCE_TYPE_COLORS.article,
  pdf: RESOURCE_TYPE_COLORS.pdf,
  link: RESOURCE_TYPE_COLORS.link,
  webinar: 'bg-teal-100 text-teal-700',
}

const CTA_LABELS: Record<ResourceDisplayType, string> = {
  video: 'Watch',
  article: 'Read',
  pdf: 'Download',
  link: 'Visit',
  webinar: 'Watch',
}

export function ResourceCard({ resource, isCompleted, canGenerateAI = false }: ResourceCardProps) {
  const looksLikeWebinar = /webinar/i.test(resource.url) || /webinar/i.test(resource.category ?? '')
  const safeType: ResourceDisplayType = looksLikeWebinar
    ? 'webinar'
    : resource.type in TYPE_ICONS
      ? (resource.type as ResourceDisplayType)
      : 'link'
  const Icon = TYPE_ICONS[safeType]
  const typeLabel = TYPE_LABELS[safeType]
  const typeColor = TYPE_COLORS[safeType]
  const ctaLabel = CTA_LABELS[safeType] ?? 'Open'
  const thumbnail =
    resource.thumbnail_url ??
    (safeType === 'video' || safeType === 'webinar' ? getYouTubeThumbnail(resource.url) : null)
  const isExternal = resource.type !== 'pdf'
  const isAuthenticated = isCompleted !== undefined

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={`Thumbnail for ${resource.title}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon size={32} className="text-gray-300" aria-hidden="true" />
          </div>
        )}
        {/* Type badge overlay */}
        <span
          className={`absolute inset-s-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${typeColor}`}
        >
          <Icon size={10} aria-hidden="true" />
          {typeLabel}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {resource.category && (
          <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
            {resource.category}
          </p>
        )}
        <h3 className="text-wial-navy line-clamp-2 text-sm leading-snug font-semibold">
          {resource.title}
        </h3>
        {resource.description && (
          <p className="line-clamp-2 text-xs text-gray-500">{resource.description}</p>
        )}

        <ResourceAIControls
          resourceId={resource.id}
          resourceType={resource.type}
          canGenerateAI={canGenerateAI}
          initialSummary={resource.ai_summary}
          initialMarketing={resource.ai_marketing}
          initialTranscript={resource.transcript}
          initialTranscriptStatus={resource.transcript_status}
        />

        {/* CTA — interactive (completion tracking) when authenticated, static otherwise */}
        {isAuthenticated ? (
          <ResourceCardClient
            resourceId={resource.id}
            initialCompleted={isCompleted}
            resourceUrl={resource.url}
            isExternal={isExternal}
            ctaLabel={ctaLabel}
          />
        ) : (
          <div className="mt-auto pt-3">
            <a
              href={resource.url}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="text-wial-red hover:text-wial-red-dark inline-flex items-center gap-1 text-xs font-semibold"
            >
              {ctaLabel}
              <ExternalLink size={10} aria-hidden="true" />
              {isExternal && <span className="sr-only"> (opens in new tab)</span>}
            </a>
          </div>
        )}
      </div>
    </article>
  )
}
