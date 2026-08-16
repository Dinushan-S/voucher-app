import type { PageServerLoad } from './$types';
import { supabase } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
  const { data: vouchers } = await supabase
    .from('vouchers')
    .select('voucher_code, denomination_amount, redeemed_at')
    .eq('status', 'redeemed')
    .order('redeemed_at', { ascending: false })
    .limit(100);

  return { vouchers: vouchers ?? [] };
};
