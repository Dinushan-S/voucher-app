import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// Server-only client using the service-role key. Never import this in client code.
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export type VoucherStatus = 'active' | 'redeemed' | 'expired';

export interface Voucher {
  id: string;
  batch_id: string | null;
  voucher_code: string;
  denomination_amount: number;
  currency: string;
  status: VoucherStatus;
  expiry_date: string;
  created_at: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
  redeemed_location: string | null;
}
