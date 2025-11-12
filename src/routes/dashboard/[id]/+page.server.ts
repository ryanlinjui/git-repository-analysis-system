import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/');
	}

	const requestedUserId = params.id;
	const currentUserId = locals.user.uid;

	// Check if the authenticated user is trying to access their own dashboard
	if (requestedUserId !== currentUserId) {
		throw error(403, {
			message: 'Forbidden: You do not have access to this dashboard.'
		});
	}

	return {
		userId: currentUserId
	};
};
