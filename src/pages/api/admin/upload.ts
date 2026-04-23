import type { APIRoute } from 'astro'
import { isAuthenticated, validateCsrf } from '../../../lib/cms/auth'
import { extname } from 'node:path'
import { saveCmsAsset } from '../../../lib/cms/storage'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_DOCUMENT_BYTES = 16 * 1024 * 1024
const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.odt',
  '.ods',
])

function parseCategory(input: FormDataEntryValue | null): 'sponsors' | 'carousel' | 'documents' {
  if (typeof input === 'string' && input === 'documents') {
    return 'documents'
  }
  if (typeof input === 'string' && input === 'sponsors') {
    return 'sponsors'
  }
  return 'carousel'
}

function isAllowedDocument(file: File): boolean {
  const extension = extname(file.name || '').toLowerCase()
  return ALLOWED_DOCUMENT_EXTENSIONS.has(extension)
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
    return new Response(JSON.stringify({ error: 'Ungültiges CSRF-Token.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const category = parseCategory(formData.get('category'))

  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'Keine Datei übergeben.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  if (category === 'documents') {
    if (!isAllowedDocument(file)) {
      return new Response(JSON.stringify({ error: 'Nur PDF-, Word-, Excel- oder PowerPoint-Dateien sind erlaubt.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    if (file.size > MAX_DOCUMENT_BYTES) {
      return new Response(JSON.stringify({ error: 'Datei ist zu groß (max. 16MB).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }
  } else {
    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Nur Bilddateien sind erlaubt.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return new Response(JSON.stringify({ error: 'Datei ist zu groß (max. 8MB).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }
  }

  const bytes = new Uint8Array(await file.arrayBuffer())

  try {
    const src = await saveCmsAsset({
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
