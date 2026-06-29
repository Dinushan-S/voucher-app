import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { supabase } from '$lib/server/supabase';

// Daily Vercel Cron. Flips lapsed 'active' vouchers to 'expired' so the
// stored state matches reality (verify already checks the date live).
export const GET: RequestHandler = async ({ request }) => {
  // Vercel sends: Authorization: Bearer <CRON_SECRET> when CRON_SECRET is set.
  const secret = env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('vouchers')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('expiry_date', today)
    .select('id');

  if (error) return json({ ok: false, error: error.message }, { status: 500 });
  return json({ ok: true, expired: data?.length ?? 0 });
};
