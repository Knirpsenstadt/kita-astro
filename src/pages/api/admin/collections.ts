import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { isAuthenticated, validateCsrf } from '../../../lib/cms/auth'
import { loadCmsStore, saveCmsStore } from '../../../lib/cms/storage'
import { getBaselineEvents, normalizeEvents } from '../../../lib/cms/events'
import { DEFAULT_CAROUSEL_IMAGES } from '../../../lib/cms/defaults'
import type { CmsEvent, CmsSponsor } from '../../../lib/cms/types'

const MAX_SPONSORS = 60
const MAX_CAROUSEL_IMAGES = 50
const MAX_EVENTS = 300

type UpdateBody = {
  sponsors?: CmsSponsor[]
  carouselImages?: string[]
  events?: CmsEvent[]
}

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) {
    return true
  }
  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:')
  )
}

function sanitizeSponsors(items: CmsSponsor[] | undefined): CmsSponsor[] {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map((item, index) => {
      const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `sponsor-${index + 1}`
      const name = typeof item.name === 'string' ? item.name.trim() : ''
      if (!name) {
        return null
      }

      const logo = typeof item.logo === 'string' ? item.logo.trim() : ''
      const website = typeof item.website === 'string' ? item.website.trim() : ''
      const description = typeof item.description === 'string' ? item.description.trim() : ''
      const support = typeof item.support === 'string' ? item.support.trim() : ''

      if (!isSafeUrl(logo) || !isSafeUrl(website)) {
        return null
      }

      return { id, name, logo, website, description, support }
    })
    .filter((item): item is CmsSponsor => !!item)
    .slice(0, MAX_SPONSORS)
}

function sanitizeCarousel(items: string[] | undefined): string[] {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => !!item && isSafeUrl(item))
    .slice(0, MAX_CAROUSEL_IMAGES)
}

function sanitizeEvents(items: CmsEvent[] | undefined): CmsEvent[] {
  return normalizeEvents(items, MAX_EVENTS)
}

async function loadSponsorsFromContent(): Promise<CmsSponsor[]> {
  const entries = await getCollection('sponsors')
  return entries.map((entry) => ({
    id: entry.id,
    name: entry.data.name,
    logo: entry.data.logo || '',
    website: entry.data.website || '',
    description: entry.data.description || '',
    support: entry.data.support || '',
  }))
}

function getEffectiveSponsors(draftSponsors: CmsSponsor[], publishedSponsors: CmsSponsor[], contentSponsors: CmsSponsor[]): CmsSponsor[] {
  if (draftSponsors.length > 0) {
    return draftSponsors
  }
  if (publishedSponsors.length > 0) {
    return publishedSponsors
  }
  return contentSponsors
}

function getEffectiveCarousel(draftImages: string[], publishedImages: string[]): string[] {
  if (draftImages.length > 0) {
    return draftImages
  }
  if (publishedImages.length > 0) {
    return publishedImages
  }
  return [...DEFAULT_CAROUSEL_IMAGES]
}

function getEffectiveEvents(draftEvents: CmsEvent[], publishedEvents: CmsEvent[], baselineEvents: CmsEvent[]): CmsEvent[] {
  if (draftEvents.length > 0) {
    return draftEvents
  }
  if (publishedEvents.length > 0) {
    return publishedEvents
  }
  return baselineEvents
}

export const prerender = false

export const GET: APIRoute = async ({ cookies }) => {
  if (!isAuthenticated(cookies)) {
    return new Response(JSON.stringify({ error: 'Nicht angemeldet.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  const store = await loadCmsStore(true)
  const contentSponsors = await loadSponsorsFromContent()
  const baselineEvents = getBaselineEvents()

  const effectiveDraftData = {
    sponsors: getEffectiveSponsors(store.draftData.sponsors, store.publishedData.sponsors, contentSponsors),
    carouselImages: getEffectiveCarousel(store.draftData.carouselImages, store.publishedData.carouselImages),
    events: getEffectiveEvents(store.draftData.events, store.publishedData.events, baselineEvents),
  }

  const effectivePublishedData = {
    sponsors: store.publishedData.sponsors.length > 0 ? store.publishedData.sponsors : contentSponsors,
    carouselImages:
      store.publishedData.carouselImages.length > 0
        ? store.publishedData.carouselImages
        : [...DEFAULT_CAROUSEL_IMAGES],
    events: store.publishedData.events.length > 0 ? store.publishedData.events : baselineEvents,
  }

  return new Response(
    JSON.stringify({
      draftData: effectiveDraftData,
      publishedData: effectivePublishedData,
      baselineData: {
        sponsors: contentSponsors,
        carouselImages: [...DEFAULT_CAROUSEL_IMAGES],
        events: baselineEvents,
      },
      publishedAt: store.publishedAt,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    }
  )
}

export const PUT: APIRoute = async ({ request, cookies }) => {
  if (!isAuthenticated(cookies)) {
    return new Response(JSON.stringify({ error: 'Nicht angemeldet.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  if (!validateCsrf(cookies, request)) {
    return new Response(JSON.stringify({ error: 'Ungueltiges CSRF-Token.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  let body: UpdateBody
  try {
    body = (await request.json()) as UpdateBody
  } catch {
    return new Response(JSON.stringify({ error: 'Ungueltige Anfrage.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  const store = await loadCmsStore(true)

  if (body.sponsors) {
    store.draftData.sponsors = sanitizeSponsors(body.sponsors)
  }

  if (body.carouselImages) {
    store.draftData.carouselImages = sanitizeCarousel(body.carouselImages)
  }

  if (body.events) {
    store.draftData.events = sanitizeEvents(body.events)
  }

  store.updatedAt = new Date().toISOString()
  await saveCmsStore(store, 'Update draft collections')

  return new Response(
    JSON.stringify({ success: true, draftData: store.draftData, publishedAt: store.publishedAt }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    }
  )
}
