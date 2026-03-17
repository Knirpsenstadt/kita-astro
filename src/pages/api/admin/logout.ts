import type { APIRoute } from 'astro'
import { clearModeCookie, clearSessionCookie } from '../../../lib/cms/auth'

export const prerender = false

export const POST: APIRoute = async ({ request, cookies }) => {
  clearSessionCookie(cookies, request)
  clearModeCookie(cookies, request)

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
