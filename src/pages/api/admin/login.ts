import type { APIRoute } from 'astro'
import {
  clearFailedLogins,
  createSession,
  getClientIdentifier,
  getRateLimitState,
  isAdminPasswordConfigured,
  markFailedLogin,
  setModeCookie,
  setSessionCookie,
  verifyPassword,
} from '../../../lib/cms/auth'

export const prerender = false

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAdminPasswordConfigured()) {
    return new Response(JSON.stringify({ error: 'CMS admin password is not configured.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  const clientId = getClientIdentifier(request)
  const rateLimit = getRateLimitState(clientId)

  if (!rateLimit.allowed) {
    const waitMinutes = Math.ceil(rateLimit.waitMs / 60000)
    return new Response(
      JSON.stringify({ error: `Zu viele Versuche. Bitte in ${waitMinutes} Minuten erneut probieren.` }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    )
  }

  let password = ''
  try {
    const body = (await request.json()) as { password?: string }
    if (typeof body.password === 'string') {
      password = body.password
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Ungueltige Anfrage.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  if (!verifyPassword(password)) {
    markFailedLogin(clientId)
    const nextRate = getRateLimitState(clientId)
    const error =
      nextRate.remaining > 0
        ? `Falsches Passwort. Noch ${nextRate.remaining} Versuche.`
        : 'Falsches Passwort. Login ist fuer 15 Minuten gesperrt.'

    return new Response(JSON.stringify({ error }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  clearFailedLogins(clientId)
  const session = createSession()
  setSessionCookie(cookies, request, session)
  setModeCookie(cookies, request, 'draft')

  return new Response(JSON.stringify({ success: true, csrfToken: session.csrf }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
