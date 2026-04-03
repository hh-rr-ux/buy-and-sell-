/**
 * POST /api/auth/login
 *
 * Validates credentials server-side (env vars — never exposed to the browser),
 * then issues a signed HttpOnly JWT cookie on success.
 *
 * Required env vars (set in Cloudflare Pages dashboard, NOT prefixed NEXT_PUBLIC_):
 *   SETTINGS_ID   – admin username
 *   SETTINGS_PW   – admin password
 *   JWT_SECRET    – random secret (≥ 32 chars) for signing tokens
 */

import { signJWT, makeAuthCookie, timingSafeEqual } from '../../_lib/jwt'

interface Env {
  SETTINGS_ID: string
  SETTINGS_PW: string
  JWT_SECRET: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Guard: all required env vars must be present
  if (!env.SETTINGS_ID || !env.SETTINGS_PW || !env.JWT_SECRET) {
    return Response.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  let body: { id?: unknown; pw?: unknown }
  try {
    body = (await request.json()) as { id?: unknown; pw?: unknown }
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.id !== 'string' || typeof body.pw !== 'string') {
    return Response.json({ error: 'Missing credentials' }, { status: 400 })
  }

  // Constant-time comparison — prevents timing side-channel attacks
  const [idOk, pwOk] = await Promise.all([
    timingSafeEqual(body.id, env.SETTINGS_ID),
    timingSafeEqual(body.pw, env.SETTINGS_PW),
  ])

  if (!idOk || !pwOk) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const now = Math.floor(Date.now() / 1000)
  const token = await signJWT(
    { sub: body.id, role: 'admin', iat: now, exp: now + 8 * 3600 },
    env.JWT_SECRET,
  )

  const response = Response.json({ success: true })
  response.headers.set('Set-Cookie', makeAuthCookie(token))
  return response
}
