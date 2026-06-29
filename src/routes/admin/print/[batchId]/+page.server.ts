import { error } from '@sveltejs/kit';
import QRCode from 'qrcode';
import type { PageServerLoad } from './$types';
import { supabase, type Voucher } from '$lib/server/supabase';
import { signToken } from '$lib/server/codes';
import { VERIFY_BASE } from '$env/static/private';

export const load: PageServerLoad = async ({ params }) => {
  const { data: batch } = await supabase
    .from('voucher_batches')
    .select('*')
    .eq('id', params.batchId)
    .maybeSingle();

  if (!batch) throw error(404, 'Batch not found');

  const { data: vouchers } = await supabase
    .from('vouchers')
    .select('*')
    .eq('batch_id', params.batchId)
    .order('denomination_amount', { ascending: true })
    .returns<Voucher[]>();

  const cards = await Promise.all(
    (vouchers ?? []).map(async (v) => {
      const token = signToken(v.voucher_code);
      const url = `${VERIFY_BASE}/scan?t=${encodeURIComponent(token)}`;
      const qr = await QRCode.toDataURL(url, { margin: 1, width: 240 });
      return {
        code: v.voucher_code,
        amount: v.denomination_amount,
        expiry: v.expiry_date,
        qr
      };
    })
  );

  return { batch, cards };
};
