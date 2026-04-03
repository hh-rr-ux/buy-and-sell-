/**
 * GET /logout  (handles the sidebar logout link)
 *
 * Clears the auth cookie and redirects to the home page.
 * Works without JavaScript — the sidebar's <a href="/logout"> uses this.
 */

import { clearAuthCookie } from './_lib/jwt'

export const onRequest: PagesFunction = async () => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': clearAuthCookie(),
    },
  })
}
