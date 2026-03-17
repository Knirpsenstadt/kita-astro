import type { AstroCookies } from 'astro'
import { getModeFromCookies, getSession } from './auth'
import { loadCmsStore } from './storage'
import type { CmsMode } from './types'
import type { CmsEvent, CmsSponsor } from './types'

type ContextLike = {
  cookies: AstroCookies
  request: Request
}

export type CmsRuntime = {
  isAdmin: boolean
  mode: CmsMode
  csrfToken: string | null
  text: (key: string, fallback: string) => string
  attrs: (key: string) => Record<string, string>
  sponsors: (fallback: CmsSponsor[]) => CmsSponsor[]
  carouselImages: (fallback: string[]) => string[]
  events: (fallback: CmsEvent[]) => CmsEvent[]
}

export async function getCmsRuntime(context: ContextLike): Promise<CmsRuntime> {
  const session = getSession(context.cookies)
  const isAdmin = !!session
  const requestedMode = getModeFromCookies(context.cookies)
  const mode: CmsMode = isAdmin ? requestedMode : 'published'

  const store = await loadCmsStore()
  const source = mode === 'draft' ? store.draft : store.published
  const sourceData = mode === 'draft' ? store.draftData : store.publishedData

  return {
    isAdmin,
    mode,
    csrfToken: session?.csrf || null,
    text: (key: string, fallback: string) => {
      const value = source[key]
      return typeof value === 'string' ? value : fallback
    },
    attrs: (key: string) => {
      if (!isAdmin) {
        return {}
      }
      return {
        'data-cms-editable': 'true',
        'data-cms-key': key,
      }
    },
    sponsors: (fallback: CmsSponsor[]) => {
      if (sourceData.sponsors.length === 0) {
        return fallback
      }
      return sourceData.sponsors.map((item) => ({ ...item }))
    },
    carouselImages: (fallback: string[]) => {
      if (sourceData.carouselImages.length === 0) {
        return fallback
      }
      return [...sourceData.carouselImages]
    },
    events: (fallback: CmsEvent[]) => {
      if (sourceData.events.length === 0) {
        return fallback
      }
      return sourceData.events.map((item) => ({ ...item }))
    },
  }
}
