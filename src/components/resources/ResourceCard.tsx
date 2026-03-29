import Image from 'next/image'
import { Play, FileText, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import {
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_COLORS,
  getYouTubeThumbnail,
} from '@/features/resources/types'
import { ResourceCardClient } from '@/components/resources/ResourceCardClient'
import { ResourceAIControls } from '@/components/resources/ResourceAIControls'
import type { Resource } from '@/features/resources/types'
import type { TeachingCoachPreview } from '@/features/resources/queries/getCoachCourseMappings'

interface ResourceCardProps {
  resource: Resource
  teachingCoaches?: TeachingCoachPreview[]
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


export function ResourceCard({ resource, teachingCoaches = [], isCompleted, canGenerateAI = false }: ResourceCardProps) {
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
          <p className="text-xs font-medium tracking-wide text-gray-600 uppercase">
            {resource.category}
          </p>
        )}
        <h3 className="text-wial-navy line-clamp-2 text-sm leading-snug font-semibold">
          {resource.title}
        </h3>

        {/* Presenter / Authors Meta */}
        {(resource.presenter || (resource.authors && resource.authors.length > 0)) && (
          <p className="text-[11px] font-medium text-gray-500">
            {resource.type === 'webinar' && resource.presenter && (
              <span>By {resource.presenter}</span>
            )}
            {resource.type === 'article' && resource.authors && (
              <span>
                {resource.authors.join(', ')}
                {resource.published_year && ` • ${resource.published_year}`}
              </span>
            )}
          </p>
        )}

        {/* AI Summary */}
        {resource.summary && (
          <div className="rounded-lg bg-blue-50/50 p-2.5">
            <p className="line-clamp-3 text-xs leading-relaxed text-blue-900 italic">
              "{resource.summary}"
            </p>
          </div>
        )}

        {resource.description && !resource.summary && (
          <p className="line-clamp-2 text-xs text-gray-500">{resource.description}</p>
        )}

        {teachingCoaches.length > 0 && (
          <div className="mt-1">
            <p className="text-[11px] font-medium text-gray-500">Taught by</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {teachingCoaches.slice(0, 3).map((coach) => (
                <Link
                  key={coach.coachId}
                  href={`/coaches/${coach.coachId}`}
                  className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-brand-shell)] hover:bg-red-100"
                >
                  {coach.name}
                </Link>
              ))}
              {teachingCoaches.length > 3 && (
                <span className="text-[10px] font-medium text-gray-400">
                  +{teachingCoaches.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Key Findings Tags */}
        {resource.relevance_tags && resource.relevance_tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {resource.relevance_tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        <ResourceAIControls
          resourceId={resource.id}
          resourceType={resource.type}
          canGenerateAI={canGenerateAI}
          initialSummary={resource.ai_summary}
          initialMarketing={resource.ai_marketing}
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
