import type { Resource } from '@/features/resources/types'

export type ResourceCollection = 'all' | 'journals' | 'courses' | 'webinars'

export function filterResourcesByCollection(
  resources: Resource[],
  collection: ResourceCollection
): Resource[] {
  if (collection === 'all') return resources

  return resources.filter((resource) => {
    const haystack = `${resource.title} ${resource.description ?? ''} ${resource.category ?? ''} ${resource.url}`

    if (collection === 'journals') {
      return /(journal|publication|paper|research)/i.test(haystack)
    }

    if (collection === 'courses') {
      return /(course|certification|training|program|workshop)/i.test(haystack)
    }

    if (collection === 'webinars') {
      return /webinar/i.test(haystack)
    }
    return true
  })
}
