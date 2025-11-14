import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete('session', { 
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'strict'
	});
	return json({ status: 'success' });
};
