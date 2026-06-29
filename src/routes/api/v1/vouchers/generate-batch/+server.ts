import { json, type RequestHandler } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import { makeCode } from '$lib/server/codes';

interface BatchRow {
  amount: number;
  count: number;
}

const MAX_RETRY = 5;

export const POST: RequestHandler = async ({ request }) => {
  const idemKey = request.headers.get('idempotency-key') ?? undefined;
  const body = await request.json().catch(() => null);

  const expiry: string = body?.expiry_date;
  const batches: BatchRow[] = body?.batches;

  if (!expiry || !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
    return json({ error: 'expiry_date must be YYYY-MM-DD' }, { status: 400 });
  }
  if (!Array.isArray(batches) || batches.length === 0) {
    return json({ error: 'batches array is required' }, { status: 400 });
  }
  for (const b of batches) {
    if (!Number.isInteger(b.amount) || b.amount <= 0) {
      return json({ error: `Invalid amount: ${b.amount}` }, { status: 400 });
    }
    if (!Number.isInteger(b.count) || b.count <= 0 || b.count > 500) {
      return json({ error: `Invalid count: ${b.count}` }, { status: 400 });
    }
  }

  // Idempotency: return the existing batch if this key was already used.
  if (idemKey) {
    const { data: existing } = await supabase
      .from('voucher_batches')
      .select('id')
      .eq('idempotency_key', idemKey)
      .maybeSingle();
    if (existing) {
      return json({ batch_id: existing.id, idempotent_replay: true });
    }
  }

  const totalCount = batches.reduce((s, b) => s + b.count, 0);
  const totalValue = batches.reduce((s, b) => s + b.amount * b.count, 0);

  const { data: batch, error: batchErr } = await supabase
    .from('voucher_batches')
    .insert({
      idempotency_key: idemKey,
      expiry_date: expiry,
      total_count: totalCount,
      total_value: totalValue
    })
    .select('id')
    .single();

  if (batchErr || !batch) {
    return json({ error: 'Could not create batch', detail: batchErr?.message }, { status: 500 });
  }

  // Generate every voucher, retrying on the (rare) unique-code collision.
  const inserted: { voucher_code: string; denomination_amount: number }[] = [];
  for (const b of batches) {
    for (let i = 0; i < b.count; i++) {
      let ok = false;
      for (let attempt = 0; attempt < MAX_RETRY && !ok; attempt++) {
        const code = makeCode(b.amount);
        const { error } = await supabase.from('vouchers').insert({
          batch_id: batch.id,
          voucher_code: code,
          denomination_amount: b.amount,
          currency: 'LKR',
          expiry_date: expiry
        });
        if (!error) {
          inserted.push({ voucher_code: code, denomination_amount: b.amount });
          ok = true;
        } else if (!error.message.includes('duplicate')) {
          return json({ error: 'Insert failed', detail: error.message }, { status: 500 });
        }
      }
      if (!ok) {
        return json({ error: 'Code generation collision limit reached' }, { status: 500 });
      }
    }
  }

  return json({
    batch_id: batch.id,
    expiry_date: expiry,
    total_count: totalCount,
    total_value: totalValue,
    currency: 'LKR',
    print_url: `/admin/print/${batch.id}`,
    vouchers: inserted
  });
};
