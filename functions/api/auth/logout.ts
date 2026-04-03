/**
 * POST /api/auth/logout
 *
 * Clears the HttpOnly auth cookie.
 */

import { clearAuthCookie } from '../../_lib/jwt'

export const onRequestPost: PagesFunction = async () => {
  const response = Response.json({ success: true })
  response.headers.set('Set-Cookie', clearAuthCookie())
  return response
}
