import type { APIRoute } from 'astro'
import { isAuthenticated, validateCsrf } from '../../../lib/cms/auth'
import { saveCmsImageAsset } from '../../../lib/cms/storage'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024

function parseCategory(input: FormDataEntryValue | null): 'sponsors' | 'carousel' {
  if (typeof input === 'string' && input === 'sponsors') {
    return 'sponsors'
  }
  return 'carousel'
}

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

  const formData = await request.formData()
  const file = formData.get('file')
  const category = parseCategory(formData.get('category'))

  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'Keine Datei uebergeben.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  if (!file.type.startsWith('image/')) {
    return new Response(JSON.stringify({ error: 'Nur Bilddateien sind erlaubt.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return new Response(JSON.stringify({ error: 'Datei ist zu gross (max. 8MB).' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  const bytes = new Uint8Array(await file.arrayBuffer())

  try {
    const src = await saveCmsImageAsset({
      fileName: file.name,
      mimeType: file.type,
      bytes,
      category,
    })

    return new Response(JSON.stringify({ success: true, src }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload fehlgeschlagen.'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}
