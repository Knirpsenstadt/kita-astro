import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'
import type { CmsDocumentGroup, CmsDocumentItem, CmsSponsor, CmsStore, CmsStructuredData } from './types'
import { readEnv } from './env'
import { cloneEvents, normalizeEvents } from './events'

const CACHE_MS = 1500
const DEFAULT_STORE: CmsStore = {
  draft: {},
  published: {},
  draftData: {
    sponsors: [],
    carouselImages: [],
    documentGroups: [],
    events: [],
  },
  publishedData: {
    sponsors: [],
    carouselImages: [],
    documentGroups: [],
    events: [],
  },
  updatedAt: new Date(0).toISOString(),
  publishedAt: null,
}

let cache: CmsStore | null = null
let cacheAt = 0

function getLocalPath(): string {
  return resolve(process.cwd(), readEnv('CMS_LOCAL_STORE_PATH') || 'cms-data/inline-cms.json')
}

function getGithubConfig(): {
  token: string
  repo: string
  branch: string
  filePath: string
} | null {
  const token = readEnv('CMS_GITHUB_TOKEN') || readEnv('GITHUB_TOKEN')
  const repo = readEnv('CMS_GITHUB_REPO') || readEnv('GITHUB_REPO')
  if (!token || !repo) {
    return null
  }

  return {
    token,
    repo,
    branch: readEnv('CMS_GITHUB_BRANCH') || readEnv('GITHUB_BRANCH') || 'main',
    filePath: readEnv('CMS_GITHUB_FILE_PATH') || 'cms/inline-cms.json',
  }
}

export function getStorageMode(): 'local' | 'github' {
  return getGithubConfig() ? 'github' : 'local'
}

function normalizeUrl(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }
  const url = value.trim()
  if (!url) {
    return ''
  }
  const lower = url.toLowerCase()
  if (lower.startsWith('javascript:') || lower.startsWith('data:text/html')) {
    return ''
  }
  return url
}

function normalizeSponsors(value: unknown): CmsSponsor[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item): CmsSponsor | null => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const source = item as Partial<CmsSponsor>
      const id = typeof source.id === 'string' ? source.id.trim() : ''
      const name = typeof source.name === 'string' ? source.name.trim() : ''
      if (!id || !name) {
        return null
      }

      return {
        id,
        name,
        logo: normalizeUrl(source.logo),
        website: normalizeUrl(source.website),
        description: typeof source.description === 'string' ? source.description.trim() : '',
        support: typeof source.support === 'string' ? source.support.trim() : '',
      }
    })
    .filter((item): item is CmsSponsor => !!item)
}

function normalizeCarousel(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => normalizeUrl(item))
    .filter((item) => !!item)
}

function normalizeDocumentItems(value: unknown): CmsDocumentItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item): CmsDocumentItem | null => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const source = item as Partial<CmsDocumentItem>
      const id = typeof source.id === 'string' ? source.id.trim() : ''
      const title = typeof source.title === 'string' ? source.title.trim() : ''
      const href = normalizeUrl(source.href)
      if (!id || !title || !href) {
        return null
      }

      return {
        id,
        title,
        description: typeof source.description === 'string' ? source.description.trim() : '',
        href,
        icon: typeof source.icon === 'string' ? source.icon.trim() : '',
        badge: typeof source.badge === 'string' ? source.badge.trim() : '',
      }
    })
    .filter((item): item is CmsDocumentItem => !!item)
}

function normalizeDocumentGroups(value: unknown): CmsDocumentGroup[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item): CmsDocumentGroup | null => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const source = item as Partial<CmsDocumentGroup>
      const id = typeof source.id === 'string' ? source.id.trim() : ''
      if (!id) {
        return null
      }

      return {
        id,
        heading: typeof source.heading === 'string' ? source.heading.trim() : '',
        documents: normalizeDocumentItems(source.documents),
      }
    })
    .filter((item): item is CmsDocumentGroup => !!item)
}

function normalizeStructuredData(value: unknown): CmsStructuredData {
  if (!value || typeof value !== 'object') {
    return {
      sponsors: [],
      carouselImages: [],
      documentGroups: [],
      events: [],
    }
  }

  const source = value as Partial<CmsStructuredData>
  return {
    sponsors: normalizeSponsors(source.sponsors),
    carouselImages: normalizeCarousel(source.carouselImages),
    documentGroups: normalizeDocumentGroups(source.documentGroups),
    events: normalizeEvents(source.events),
  }
}

function cloneStore(store: CmsStore): CmsStore {
  return {
    draft: { ...store.draft },
    published: { ...store.published },
    draftData: {
      sponsors: store.draftData.sponsors.map((item) => ({ ...item })),
      carouselImages: [...store.draftData.carouselImages],
      documentGroups: store.draftData.documentGroups.map((group) => ({
        ...group,
        documents: group.documents.map((item) => ({ ...item })),
      })),
      events: cloneEvents(store.draftData.events),
    },
    publishedData: {
      sponsors: store.publishedData.sponsors.map((item) => ({ ...item })),
      carouselImages: [...store.publishedData.carouselImages],
      documentGroups: store.publishedData.documentGroups.map((group) => ({
        ...group,
        documents: group.documents.map((item) => ({ ...item })),
      })),
      events: cloneEvents(store.publishedData.events),
    },
    updatedAt: store.updatedAt,
    publishedAt: store.publishedAt,
  }
}

function normalizeStore(input: unknown): CmsStore {
  if (!input || typeof input !== 'object') {
    return cloneStore(DEFAULT_STORE)
  }

  const typed = input as Partial<CmsStore>
  const draft = typed.draft && typeof typed.draft === 'object' ? typed.draft : {}
  const published = typed.published && typeof typed.published === 'object' ? typed.published : {}

  return {
    draft: Object.fromEntries(
      Object.entries(draft).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    ),
    published: Object.fromEntries(
      Object.entries(published).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    ),
    draftData: normalizeStructuredData(typed.draftData),
    publishedData: normalizeStructuredData(typed.publishedData),
    updatedAt: typeof typed.updatedAt === 'string' ? typed.updatedAt : new Date().toISOString(),
    publishedAt: typeof typed.publishedAt === 'string' || typed.publishedAt === null ? typed.publishedAt : null,
  }
}

async function readLocalStore(): Promise<CmsStore> {
  const filePath = getLocalPath()
  try {
    const raw = await readFile(filePath, 'utf8')
    return normalizeStore(JSON.parse(raw))
  } catch {
    return cloneStore(DEFAULT_STORE)
  }
}

async function writeLocalStore(store: CmsStore): Promise<void> {
  const filePath = getLocalPath()
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8')
}

type GithubFile = {
  exists: boolean
  sha: string | null
  content: string | null
}

function toGitHubContentUrl(config: NonNullable<ReturnType<typeof getGithubConfig>>, filePath: string): string {
  return `https://api.github.com/repos/${config.repo}/contents/${filePath}`
}

async function putGithubFile(
  config: NonNullable<ReturnType<typeof getGithubConfig>>,
  filePath: string,
  contentBase64: string,
  commitMessage: string
): Promise<void> {
  const latest = await fetchGithubFile({ ...config, filePath })

  const response = await fetch(toGitHubContentUrl(config, filePath), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: commitMessage,
      content: contentBase64,
      branch: config.branch,
      ...(latest.sha ? { sha: latest.sha } : {}),
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`GitHub write failed: ${response.status} ${message}`)
  }
}

async function deleteGithubFile(
  config: NonNullable<ReturnType<typeof getGithubConfig>>,
  filePath: string,
  commitMessage: string
): Promise<void> {
  const latest = await fetchGithubFile({ ...config, filePath })
  if (!latest.exists || !latest.sha) {
    return
  }

  const response = await fetch(toGitHubContentUrl(config, filePath), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: commitMessage,
      branch: config.branch,
      sha: latest.sha,
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`GitHub delete failed: ${response.status} ${message}`)
  }
}

async function fetchGithubFile(config: NonNullable<ReturnType<typeof getGithubConfig>>): Promise<GithubFile> {
  const endpoint = `https://api.github.com/repos/${config.repo}/contents/${config.filePath}?ref=${config.branch}`
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (response.status === 404) {
    return { exists: false, sha: null, content: null }
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`GitHub read failed: ${response.status} ${message}`)
  }

  const payload = (await response.json()) as { sha: string; content: string }
  const decoded = Buffer.from(payload.content.replace(/\n/g, ''), 'base64').toString('utf8')

  return {
    exists: true,
    sha: payload.sha,
    content: decoded,
  }
}

async function readGithubStore(config: NonNullable<ReturnType<typeof getGithubConfig>>): Promise<CmsStore> {
  const file = await fetchGithubFile(config)
  if (!file.exists || !file.content) {
    return cloneStore(DEFAULT_STORE)
  }

  return normalizeStore(JSON.parse(file.content))
}

async function writeGithubStore(
  config: NonNullable<ReturnType<typeof getGithubConfig>>,
  store: CmsStore,
  commitMessage: string
): Promise<void> {
  const contentBase64 = Buffer.from(`${JSON.stringify(store, null, 2)}\n`, 'utf8').toString('base64')
  await putGithubFile(config, config.filePath, contentBase64, commitMessage)
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType === 'image/jpeg') return '.jpg'
  if (mimeType === 'image/png') return '.png'
  if (mimeType === 'image/webp') return '.webp'
  if (mimeType === 'image/gif') return '.gif'
  if (mimeType === 'image/svg+xml') return '.svg'
  if (mimeType === 'application/pdf') return '.pdf'
  if (mimeType === 'application/msword') return '.doc'
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '.docx'
  if (mimeType === 'application/vnd.ms-excel') return '.xls'
  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return '.xlsx'
  if (mimeType === 'application/vnd.ms-powerpoint') return '.ppt'
  if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return '.pptx'
  if (mimeType === 'application/vnd.oasis.opendocument.text') return '.odt'
  if (mimeType === 'application/vnd.oasis.opendocument.spreadsheet') return '.ods'
  return ''
}

function slugifyFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export async function saveCmsAsset(options: {
  fileName: string
  mimeType: string
  bytes: Uint8Array
  category: 'sponsors' | 'carousel' | 'documents'
}): Promise<string> {
  const extension = extname(options.fileName).toLowerCase() || extensionFromMimeType(options.mimeType)
  const isDocument = options.category === 'documents'
  const baseName = slugifyFileName(options.fileName.replace(/\.[^.]+$/, '')) || (isDocument ? 'document' : 'image')
  const stamp = Date.now()
  const fileName = `${baseName}-${stamp}${extension || (isDocument ? '.pdf' : '.jpg')}`
  const relativePath = isDocument ? `public/uploads/cms/${fileName}` : `public/img/uploads/${options.category}/${fileName}`
  const githubConfig = getGithubConfig()

  if (githubConfig) {
    await putGithubFile(
      githubConfig,
      relativePath,
      Buffer.from(options.bytes).toString('base64'),
      `Upload asset: ${fileName}`
    )

    const branch = encodeURIComponent(githubConfig.branch)
    return `https://cdn.jsdelivr.net/gh/${githubConfig.repo}@${branch}/${relativePath}`
  }

  const localPath = resolve(process.cwd(), relativePath)
  await mkdir(dirname(localPath), { recursive: true })
  await writeFile(localPath, Buffer.from(options.bytes))
  return isDocument ? `/uploads/cms/${fileName}` : `/img/uploads/${options.category}/${fileName}`
}

function hrefToManagedPublicPath(href: string): string | null {
  const trimmed = href.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith('/uploads/cms/')) {
    return `public${trimmed}`
  }

  if (trimmed.startsWith('/uploads/')) {
    return `public${trimmed}`
  }

  if (trimmed.startsWith('/img/uploads/')) {
    return `public${trimmed}`
  }

  try {
    const url = new URL(trimmed)
    const marker = '/public/'
    const markerIndex = url.pathname.indexOf(marker)
    if (markerIndex >= 0) {
      return url.pathname.slice(markerIndex + 1)
    }
  } catch {
    return null
  }

  return null
}

export function isManagedCmsAssetHref(href: string): boolean {
  const publicPath = hrefToManagedPublicPath(href)
  if (!publicPath) {
    return false
  }

  if (publicPath.startsWith('public/uploads/cms/') || publicPath.startsWith('public/img/uploads/')) {
    return true
  }

  return /-\d{13}\.[a-z0-9]+$/i.test(publicPath)
}

export async function deleteCmsAsset(href: string): Promise<void> {
  if (!isManagedCmsAssetHref(href)) {
    return
  }

  const publicPath = hrefToManagedPublicPath(href)
  if (!publicPath) {
    return
  }

  const githubConfig = getGithubConfig()

  if (githubConfig) {
    await deleteGithubFile(githubConfig, publicPath, `Delete asset: ${publicPath.split('/').pop() || 'asset'}`)
    return
  }

  const localPath = resolve(process.cwd(), publicPath)
  try {
    await unlink(localPath)
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) {
      throw error
    }
  }
}

export async function loadCmsStore(forceRefresh = false): Promise<CmsStore> {
  if (!forceRefresh && cache && Date.now() - cacheAt < CACHE_MS) {
    return cloneStore(cache)
  }

  const githubConfig = getGithubConfig()
  let store: CmsStore

  if (githubConfig) {
    try {
      store = await readGithubStore(githubConfig)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown storage error'
      console.error(`[CMS] GitHub storage unavailable, falling back to local file: ${message}`)
      store = await readLocalStore()
    }
  } else {
    store = await readLocalStore()
  }

  cache = store
  cacheAt = Date.now()
  return cloneStore(store)
}

export async function saveCmsStore(store: CmsStore, commitMessage: string): Promise<void> {
  const normalized = normalizeStore(store)
  const githubConfig = getGithubConfig()

  if (githubConfig) {
    try {
      await writeGithubStore(githubConfig, normalized, commitMessage)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown storage error'
      throw new Error(`GitHub write failed. Check token and repository permissions. ${message}`)
    }
  } else {
    await writeLocalStore(normalized)
  }

  cache = normalized
  cacheAt = Date.now()
}
