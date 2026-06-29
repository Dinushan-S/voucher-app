import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { isAuthed } from '$lib/server/auth';

// Paths reachable without a session.
const PUBLIC = ['/login', '/api/v1/auth/login', '/api/v1/cron/expire-vouchers'];

export const handle: Handle = async ({ event, resolve }) => {
  const authed = await isAuthed(event.cookies);
  event.locals.authed = authed;

  const path = event.url.pathname;
  const isPublic = PUBLIC.some((p) => path === p || path.startsWith(p + '/'));

  if (!authed && !isPublic) {
    if (path.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }
    throw redirect(303, '/login');
  }

  return resolve(event);
};
