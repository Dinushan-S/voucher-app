import { json, type RequestHandler } from '@sveltejs/kit';
import { clearSession } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies }) => {
  clearSession(cookies);
  return json({ ok: true });
};
