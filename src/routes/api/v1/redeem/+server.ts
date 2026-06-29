import { json, type RequestHandler } from '@sveltejs/kit';
import { supabase, type Voucher } from '$lib/server/supabase';
import { verifyToken } from '$lib/server/codes';

// ATOMIC redemption. Single-use, full value, no partial use.
// The DB function flips active -> redeemed in one statement guarded by
// WHERE status='active'. Concurrent scans: only one wins (1 row), others get 0.
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const { token, location } = await request.json().catch(() => ({ token: '' }));

  let code: string | null = null;
  if (typeof token === 'string' && token.includes('.')) {
    code = verifyToken(token);
  } else if (typeof token === 'string') {
    code = token.trim().toUpperCase();
  }
  if (!code) return json({ ok: false, reason: 'invalid', message: 'Invalid code' }, { status: 400 });

  const { data, error } = await supabase.rpc('redeem_voucher', {
    p_code: code,
    p_by: 'operator',
    p_location: typeof location === 'string' ? location.slice(0, 64) : 'showroom'
  });

  if (error) {
    return json({ ok: false, reason: 'error', message: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Voucher[];

  // 0 rows => it was not active (already redeemed, expired, or missing).
  if (rows.length === 0) {
    await supabase.from('security_events').insert({
      event_type: 'redeem_conflict',
      detail: code,
      source_ip: getClientAddress()
    });
    return json({
      ok: false,
      reason: 'already_redeemed',
      message: 'Voucher could not be redeemed (already used or expired).'
    });
  }

  const v = rows[0];
  return json({
    ok: true,
    voucher_code: v.voucher_code,
    amount: v.denomination_amount,
    currency: v.currency,
    redeemed_at: v.redeemed_at
  });
};
