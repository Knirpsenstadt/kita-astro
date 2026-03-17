import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { AstroCookies } from 'astro'
import type { CmsMode, CmsSession } from './types'
import { readEnv } from './env'

const SESSION_COOKIE = 'cms_session'
const MODE_COOKIE = 'cms_mode'
const SESSION_TTL_SECONDS = 60 * 60 * 24
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_LOCK_MS = 15 * 60 * 1000

type AttemptInfo = {
  count: number
  lockUntil: number
}

declare global {
  // eslint-disable-next-line no-var
  var __kitaCmsAttempts: Map<string, AttemptInfo> | undefined
}

const attempts = globalThis.__kitaCmsAttempts ?? new Map<string, AttemptInfo>()
globalThis.__kitaCmsAttempts = attempts

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function getSessionSecret(): string {
  return (
    readEnv('CMS_SESSION_SECRET') ||
    readEnv('CMS_ADMIN_PASSWORD') ||
    readEnv('ADMIN_PASSWORD') ||
    'local-dev-secret-change-me'
  )
}

export function getAdminPassword(): string {
  return readEnv('CMS_ADMIN_PASSWORD') || readEnv('ADMIN_PASSWORD') || ''
}

export function isAdminPasswordConfigured(): boolean {
  return getAdminPassword().length > 0
}

function signPayload(payloadB64: string): string {
  return createHmac('sha256', getSessionSecret()).update(payloadB64).digest('base64url')
}

function secureEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) {
    return false
  }
  return timingSafeEqual(aBuf, bBuf)
}

function buildToken(session: CmsSession): string {
  const payload = toBase64Url(JSON.stringify(session))
  const signature = signPayload(payload)
  return `${payload}.${signature}`
}

function parseToken(token: string | undefined): CmsSession | null {
  if (!token) {
    return null
  }

  const [payload, signature] = token.split('.')
  if (!payload || !signature) {
    return null
  }

  const expected = signPayload(payload)
  if (!secureEquals(signature, expected)) {
    return null
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as CmsSession
    if (!parsed.exp || !parsed.csrf) {
      return null
    }
    if (Date.now() >= parsed.exp) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function isSecureRequest(request: Request): boolean {
  const forwardedProto = request.headers.get('x-forwarded-proto')
  if (forwardedProto) {
    return forwardedProto === 'https'
  }
  return new URL(request.url).protocol === 'https:'
}

export function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const directIp = request.headers.get('cf-connecting-ip')
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || directIp || 'unknown'
  const ua = request.headers.get('user-agent') || 'unknown-agent'
  const uaHash = createHmac('sha256', 'ua-fingerprint').update(ua).digest('hex').slice(0, 10)
  return `${ip}:${uaHash}`
}

export function getRateLimitState(clientId: string): {
  allowed: boolean
  remaining: number
  waitMs: number
} {
  const current = attempts.get(clientId)
  const now = Date.now()

  if (!current) {
    return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1, waitMs: 0 }
  }

  if (current.lockUntil > now) {
    return { allowed: false, remaining: 0, waitMs: current.lockUntil - now }
  }

  if (current.lockUntil && current.lockUntil <= now) {
    attempts.delete(clientId)
    return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1, waitMs: 0 }
  }

  return {
    allowed: true,
    remaining: Math.max(0, MAX_LOGIN_ATTEMPTS - current.count - 1),
    waitMs: 0,
  }
}

export function markFailedLogin(clientId: string): void {
  const now = Date.now()
  const current = attempts.get(clientId) ?? { count: 0, lockUntil: 0 }
  current.count += 1
  if (current.count >= MAX_LOGIN_ATTEMPTS) {
    current.lockUntil = now + LOGIN_LOCK_MS
  }
  attempts.set(clientId, current)
}

export function clearFailedLogins(clientId: string): void {
  attempts.delete(clientId)
}

export function createSession(): CmsSession {
  return {
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
    csrf: randomBytes(24).toString('base64url'),
  }
}

export function getSession(cookies: AstroCookies): CmsSession | null {
  const token = cookies.get(SESSION_COOKIE)?.value
  return parseToken(token)
}

export function isAuthenticated(cookies: AstroCookies): boolean {
  return getSession(cookies) !== null
}

export function setSessionCookie(cookies: AstroCookies, request: Request, session: CmsSession): void {
  cookies.set(SESSION_COOKIE, buildToken(session), {
    httpOnly: true,
    sameSite: 'strict',
    secure: isSecureRequest(request),
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  })
}

export function clearSessionCookie(cookies: AstroCookies, request: Request): void {
  cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: isSecureRequest(request),
    maxAge: 0,
    path: '/',
  })
}

export function setModeCookie(cookies: AstroCookies, request: Request, mode: CmsMode): void {
  cookies.set(MODE_COOKIE, mode, {
    httpOnly: true,
    sameSite: 'strict',
    secure: isSecureRequest(request),
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  })
}

export function clearModeCookie(cookies: AstroCookies, request: Request): void {
  cookies.set(MODE_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: isSecureRequest(request),
    maxAge: 0,
    path: '/',
  })
}

export function getModeFromCookies(cookies: AstroCookies): CmsMode {
  return cookies.get(MODE_COOKIE)?.value === 'draft' ? 'draft' : 'published'
}

export function validateCsrf(cookies: AstroCookies, request: Request): boolean {
  const session = getSession(cookies)
  if (!session) {
    return false
  }
  const header = request.headers.get('x-cms-csrf')
  return !!header && secureEquals(header, session.csrf)
}

export function verifyPassword(input: string): boolean {
  const expected = getAdminPassword()
  if (!expected) {
    return false
  }
  return secureEquals(input, expected)
}

export function safeRedirectPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/')) {
    return '/'
  }
  if (value.startsWith('//')) {
    return '/'
  }
  return value
}
