export type CmsMode = 'draft' | 'published'

export interface CmsSponsor {
  id: string
  name: string
  logo?: string
  website?: string
  description?: string
  support?: string
}

export type CmsEventType = 'event' | 'closure' | 'festivity'

export interface CmsEvent {
  id: string
  label: string
  type: CmsEventType
  start: string
  end?: string
}

export interface CmsStructuredData {
  sponsors: CmsSponsor[]
  carouselImages: string[]
  events: CmsEvent[]
}

export interface CmsStore {
  draft: Record<string, string>
  published: Record<string, string>
  draftData: CmsStructuredData
  publishedData: CmsStructuredData
  updatedAt: string
  publishedAt: string | null
}

export interface CmsSession {
  exp: number
  csrf: string
}
