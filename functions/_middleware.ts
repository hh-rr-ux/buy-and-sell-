/**
 * Cloudflare Pages Functions middleware
 *
 * Runs on every request before the static asset is served.
 * Protects /admin/* routes by verifying the JWT cookie server-side.
 * Unauthenticated requests are redirected to /settings/ (the login page).
 */

import { verifyRequest } from './_lib/jwt'

interface Env {
  JWT_SECRET: string
}

const PROTECTED_PREFIXES = ['/admin/']

export const onRequest: PagesFunction<Env> = async context => {
  const { request, next, env } = context
  const url = new URL(request.url)
  const path = url.pathname

  // Only intercept protected routes
  const needsAuth = PROTECTED_PREFIXES.some(prefix => path.startsWith(prefix))
  if (!needsAuth) return next()

  // JWT_SECRET must be configured — block access if missing
  if (!env.JWT_SECRET) {
    return new Response('Server misconfigured: JWT_SECRET not set', { status: 500 })
  }

  const payload = await verifyRequest(request, env.JWT_SECRET)
  if (payload) return next()

  // Not authenticated → redirect to the login page
  return new Response(null, {
    status: 302,
    headers: { Location: '/settings/' },
  })
}
