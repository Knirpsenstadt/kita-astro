import type { APIRoute } from 'astro'
import { isAuthenticated, validateCsrf } from '../../../lib/cms/auth'
import { loadCmsStore, saveCmsStore } from '../../../lib/cms/storage'

const KEY_PATTERN = /^[a-z0-9._-]{1,180}$/i
const MAX_VALUE_LENGTH = 20000

export const prerender = false

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

  let key = ''
  let value = ''
  try {
    const body = (await request.json()) as { key?: string; value?: string }
    key = typeof body.key === 'string' ? body.key : ''
    value = typeof body.value === 'string' ? body.value : ''
  } catch {
    return new Response(JSON.stringify({ error: 'Ungueltige Anfrage.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  if (!KEY_PATTERN.test(key)) {
    return new Response(JSON.stringify({ error: 'Ungueltiger Feldschluessel.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  if (value.length > MAX_VALUE_LENGTH) {
    return new Response(JSON.stringify({ error: 'Wert ist zu lang.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  const store = await loadCmsStore(true)
  store.draft[key] = value
  store.updatedAt = new Date().toISOString()

  await saveCmsStore(store, `Draft update: ${key}`)

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
