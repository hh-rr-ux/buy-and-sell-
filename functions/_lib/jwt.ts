/**
 * JWT utilities using Web Crypto API (compatible with Cloudflare Workers)
 * HS256 signed tokens — no external dependencies required.
 */

export const COOKIE_NAME = '__auth'
const SESSION_SECONDS = 8 * 3600 // 8 hours

// ── Base64url helpers ──────────────────────────────────────────────────────

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let str = ''
  bytes.forEach(b => (str += String.fromCharCode(b)))
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4
  const padded = pad ? s + '='.repeat(4 - pad) : s
  const b64 = padded.replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

// ── Key import ────────────────────────────────────────────────────────────

function importKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  )
}

// ── JWT sign / verify ─────────────────────────────────────────────────────

const HEADER = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))

export async function signJWT(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)))
  const key = await importKey(secret, 'sign')
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${HEADER}.${body}`))
  return `${HEADER}.${body}.${b64url(sig)}`
}

export async function verifyJWT(
  token: string,
  secret: string,
): Promise<Record<string, unknown> | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  try {
    const key = await importKey(secret, 'verify')
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sig),
      new TextEncoder().encode(`${header}.${body}`),
    )
    if (!valid) return null
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as Record<string, unknown>
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────

export function getAuthToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') ?? ''
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  return match ? match[1] : null
}

export function makeAuthCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`
}

export function clearAuthCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
}

// ── Timing-safe string comparison ─────────────────────────────────────────
// Uses HMAC with a random key so comparison time is constant regardless of
// where inputs diverge, preventing timing side-channel attacks.

export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder()
  const randomKey = crypto.getRandomValues(new Uint8Array(32))
  const key = await crypto.subtle.importKey(
    'raw',
    randomKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign('HMAC', key, enc.encode(a)),
    crypto.subtle.sign('HMAC', key, enc.encode(b)),
  ])
  const da = new Uint8Array(sigA)
  const db = new Uint8Array(sigB)
  let diff = 0
  for (let i = 0; i < da.length; i++) diff |= da[i] ^ db[i]
  return diff === 0
}

// ── Auth helper for use inside function handlers ──────────────────────────

export async function verifyRequest(request: Request, secret: string): Promise<Record<string, unknown> | null> {
  const token = getAuthToken(request)
  if (!token) return null
  return verifyJWT(token, secret)
}
