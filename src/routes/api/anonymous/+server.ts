import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getClientIp, hashIp } from '$lib/server/validate/user';

/**
 * GET /api/anonymous
 * Generate and return anonymous user UID based on client IP
 * Uses the same hashing logic as server-side scan creation for consistency
 */
export const GET: RequestHandler = async ({ request }) => {
	try {
		// Get client IP address (handles x-forwarded-for, x-real-ip, etc.)
		const clientIp = getClientIp(request);
		
		// Hash the IP with salt to create a consistent and secure UID
		const anonymousUid = hashIp(clientIp);
		
		return json({
			success: true,
			uid: anonymousUid
		});
		
	} catch (error) {
		console.error('Error generating anonymous UID:', error);
		return json(
			{
				success: false,
				error: 'Failed to generate anonymous UID'
			},
			{ status: 500 }
		);
	}
};