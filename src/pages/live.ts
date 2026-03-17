import type { APIRoute } from 'astro'
import { getSession, safeRedirectPath, setModeCookie } from '../lib/cms/auth'

export const prerender = false

export const GET: APIRoute = async ({ request, cookies, url, redirect }) => {
  const target = safeRedirectPath(url.searchParams.get('redirect'))
  if (!getSession(cookies)) {
    return redirect(`/admin?next=${encodeURIComponent(target)}`)
  }

  setModeCookie(cookies, request, 'published')
  return redirect(target)
}
