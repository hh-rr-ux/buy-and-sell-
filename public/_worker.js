export default {
  async fetch(request, env) {
    const validUser = env.BASIC_AUTH_USER;
    const validPass = env.BASIC_AUTH_PASS;

    const authHeader = request.headers.get('Authorization');

    if (authHeader && authHeader.startsWith('Basic ')) {
      const encoded = authHeader.slice(6);
      const decoded = atob(encoded);
      const colonIndex = decoded.indexOf(':');
      const user = decoded.slice(0, colonIndex);
      const pass = decoded.slice(colonIndex + 1);

      if (user === validUser && pass === validPass) {
        return env.ASSETS.fetch(request);
      }
    }

    return new Response('認証が必要です', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="LA Estate"',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  },
};
