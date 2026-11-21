import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAuthed } from '$lib/server/auth';
import { supabase } from '$lib/server/supabase';
import { getShopSettings } from '$lib/server/shop';

const MAX_LOGO_BYTES = 350_000;

export const GET: RequestHandler = async ({ cookies }) => {
	if (!(await isAuthed(cookies))) return json({ error: 'Unauthorized' }, { status: 401 });
	return json(await getShopSettings());
};

export const POST: RequestHandler = async ({ cookies, request }) => {
	if (!(await isAuthed(cookies))) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') return json({ error: 'Invalid request' }, { status: 400 });

	const shop_name = typeof body.shop_name === 'string' ? body.shop_name.trim() : '';
	const address = typeof body.address === 'string' ? body.address.trim() : '';
	const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
	const logo = body.logo_data_url;

	if (!shop_name || shop_name.length > 100)
		return json({ error: 'Shop name must be 1-100 characters' }, { status: 400 });
	if (address.length > 300)
		return json({ error: 'Address must be at most 300 characters' }, { status: 400 });
	if (phone.length > 50)
		return json({ error: 'Phone must be at most 50 characters' }, { status: 400 });
	if (logo === null) {
		// clearing logo is fine
	} else if (typeof logo !== 'string' || !logo.startsWith('data:image/') || logo.length > MAX_LOGO_BYTES) {
		return json({ error: 'Logo must be a data URL image under 350KB' }, { status: 400 });
	}

	const { error } = await supabase
		.from('shop_settings')
		.upsert({
			id: 1,
			shop_name,
			address,
			phone,
			logo_data_url: logo,
			updated_at: new Date().toISOString()
		});
	if (error) return json({ error: 'Failed to save settings' }, { status: 500 });

	return json(await getShopSettings());
};
