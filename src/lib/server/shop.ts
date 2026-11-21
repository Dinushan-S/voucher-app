import { supabase } from '$lib/server/supabase';

export const DEFAULTS = {
  shop_name: 'Modern Furniture',
  logo_data_url: null as string | null,
  address: '123 Main Street, Your City',
  phone: '+00 000 000 000'
};

export type ShopSettings = typeof DEFAULTS;

export async function getShopSettings(): Promise<ShopSettings> {
  const { data } = await supabase
    .from('shop_settings')
    .select('shop_name, logo_data_url, address, phone')
    .eq('id', 1)
    .maybeSingle();

  if (!data) return { ...DEFAULTS };
  return {
    shop_name: data.shop_name || DEFAULTS.shop_name,
    logo_data_url: data.logo_data_url || null,
    address: data.address || DEFAULTS.address,
    phone: data.phone || DEFAULTS.phone
  };
}
