import type { APIRoute } from 'astro'
import { isAuthenticated, setModeCookie, validateCsrf } from '../../../lib/cms/auth'

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

  let mode: 'draft' | 'published' = 'published'
  try {
    const body = (await request.json()) as { mode?: 'draft' | 'published' }
    mode = body.mode === 'draft' ? 'draft' : 'published'
  } catch {
    return new Response(JSON.stringify({ error: 'Ungueltige Anfrage.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  setModeCookie(cookies, request, mode)

  return new Response(JSON.stringify({ success: true, mode }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
