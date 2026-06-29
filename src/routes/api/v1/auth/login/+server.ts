import { json, type RequestHandler } from '@sveltejs/kit';
import { ADMIN_PASSCODE } from '$env/static/private';
import { issueSession } from '$lib/server/auth';
import { rateLimit } from '$lib/server/ratelimit';
import { supabase } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const ip = getClientAddress();
  if (!rateLimit(`login:${ip}`, 10, 60_000)) {
    return json({ error: 'Too many attempts. Wait a minute.' }, { status: 429 });
  }

  const { passcode } = await request.json().catch(() => ({ passcode: '' }));

  if (typeof passcode !== 'string' || passcode !== ADMIN_PASSCODE) {
    await supabase.from('security_events').insert({
      event_type: 'failed_passcode',
      detail: 'Bad passcode',
      source_ip: ip
    });
    return json({ error: 'Incorrect passcode.' }, { status: 401 });
  }

  await issueSession(cookies);
  return json({ ok: true });
};
