import type { APIRoute } from 'astro'
import { isAuthenticated, setModeCookie, validateCsrf } from '../../../lib/cms/auth'
import { loadCmsStore, saveCmsStore } from '../../../lib/cms/storage'

export const prerender = false

export const POST: APIRoute = async ({ request, cookies }) => {
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

  const store = await loadCmsStore(true)
  store.published = { ...store.draft }
  store.publishedData = {
    sponsors: store.draftData.sponsors.map((item) => ({ ...item })),
    carouselImages: [...store.draftData.carouselImages],
    documentGroups: store.draftData.documentGroups.map((group) => ({
      ...group,
      documents: group.documents.map((item) => ({ ...item })),
    })),
    events: store.draftData.events.map((item) => ({ ...item })),
  }
  store.updatedAt = new Date().toISOString()
  store.publishedAt = store.updatedAt

  await saveCmsStore(store, 'Publish content updates')
  setModeCookie(cookies, request, 'published')

  return new Response(JSON.stringify({ success: true, publishedAt: store.publishedAt }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
