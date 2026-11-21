import type { PageServerLoad } from './$types';
import { getShopSettings } from '$lib/server/shop';

export const load: PageServerLoad = async () => {
	return { settings: await getShopSettings() };
};
