/**
 * GET /api/auth/check
 *
 * Returns the current auth status by verifying the HttpOnly cookie.
 * Used by SettingsPinGate and Sidebar to determine access level
 * without exposing credentials to the client.
 */

import { verifyRequest } from '../../_lib/jwt'

interface Env {
  JWT_SECRET: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.JWT_SECRET) {
    return Response.json({ authed: false })
  }

  const payload = await verifyRequest(request, env.JWT_SECRET)
  if (!payload) {
    return Response.json({ authed: false })
  }

  return Response.json({ authed: true, role: payload.role ?? 'admin' })
}
