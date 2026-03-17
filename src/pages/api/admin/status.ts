import type { APIRoute } from 'astro'
import { getModeFromCookies, getSession, isAdminPasswordConfigured } from '../../../lib/cms/auth'
import { getStorageMode, loadCmsStore } from '../../../lib/cms/storage'

export const prerender = false

export const GET: APIRoute = async ({ cookies }) => {
  const session = getSession(cookies)
  const store = await loadCmsStore()

  return new Response(
    JSON.stringify({
      authenticated: !!session,
      mode: session ? getModeFromCookies(cookies) : 'published',
      csrfToken: session?.csrf || null,
      storageMode: getStorageMode(),
      draftEntries: Object.keys(store.draft).length,
      publishedEntries: Object.keys(store.published).length,
      publishedAt: store.publishedAt,
      passwordConfigured: isAdminPasswordConfigured(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    }
  )
}
