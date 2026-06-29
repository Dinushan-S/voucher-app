import { json, type RequestHandler } from '@sveltejs/kit';
import { supabase, type Voucher } from '$lib/server/supabase';
import { verifyToken } from '$lib/server/codes';
import { rateLimit } from '$lib/server/ratelimit';

// Verify (read-only) — does NOT redeem. The scanner calls this first to show
// the green/red screen, then calls /redeem when the cashier confirms.
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const ip = getClientAddress();
  if (!rateLimit(`verify:${ip}`, 60, 60_000)) {
    return json({ error: 'Too many scans. Slow down.' }, { status: 429 });
  }

  const { token } = await request.json().catch(() => ({ token: '' }));

  // The scanned QR carries a signed token; bare codes are also accepted
  // (e.g. manual entry of the printed serial — no signature to check).
  let code: string | null = null;
  if (typeof token === 'string' && token.includes('.')) {
    code = verifyToken(token);
    if (!code) {
      await supabase.from('security_events').insert({
        event_type: 'invalid_scan',
        detail: 'Bad QR signature',
        source_ip: ip
      });
      return json({ valid: false, reason: 'invalid', message: 'Invalid or forged code' });
    }
  } else if (typeof token === 'string') {
    code = token.trim().toUpperCase();
  }

  if (!code) return json({ valid: false, reason: 'invalid', message: 'No code provided' });

  const { data } = await supabase
    .from('vouchers')
    .select('*')
    .eq('voucher_code', code)
    .maybeSingle<Voucher>();

  if (!data) {
    await supabase
      .from('security_events')
      .insert({ event_type: 'invalid_scan', detail: code, source_ip: ip });
    return json({ valid: false, reason: 'invalid', message: 'Voucher not found' });
  }

  const today = new Date().toISOString().slice(0, 10);

  if (data.status === 'redeemed') {
    return json({
      valid: false,
      reason: 'redeemed',
      message: 'Already redeemed',
      redeemed_at: data.redeemed_at
    });
  }
  if (data.status === 'expired' || data.expiry_date < today) {
    await supabase
      .from('security_events')
      .insert({ event_type: 'expired_scan', detail: code, source_ip: ip });
    return json({ valid: false, reason: 'expired', message: 'Voucher expired' });
  }

  return json({
    valid: true,
    voucher_code: data.voucher_code,
    amount: data.denomination_amount,
    currency: data.currency,
    expiry_date: data.expiry_date
  });
};
