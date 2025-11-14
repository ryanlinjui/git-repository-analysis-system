import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase';

/**
 * Server Load Function
 * Only handles authorization check - data fetching happens client-side via Firebase
 */
export const load: PageServerLoad = async ({ params, locals, depends }) => {
	depends('app:scan');
	
	const { id: scanId } = params;

	try {
		// Fetch scan to check authorization
		const scanRef = adminDb.collection('scans').doc(scanId);
		const scanDoc = await scanRef.get();

		if (!scanDoc.exists) {
			throw error(404, 'Scan not found');
		}

		const scanData = scanDoc.data();
		
		if (!scanData) {
			throw error(404, 'Scan not found');
		}

		// Anyone with the link can view the scan results (no authorization check)
		// This allows easy sharing of analysis results

		// Return minimal data - client will fetch everything via Firebase
		return {
			scanId,
			authorized: true
		};

	} catch (err) {
		console.error('Error loading scan:', err);
		
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		
		throw error(500, 'Failed to load scan data');
	}
};
