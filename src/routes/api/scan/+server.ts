import { json, type RequestEvent } from '@sveltejs/kit';
import { handleScanSubmission, runBackgroundAnalysis } from '$lib/server/scan';
import { initializeScan } from '$lib/server/scanInit';

/**
 * POST /api/scan
 * Create a new repository scan
 */
export async function POST({ request, locals }: RequestEvent) {
	try {
		// Parse and validate request body
		const body = await request.json();

		// Get user and initialize scan (includes quota check)
		const scanInit = await initializeScan(request, body, locals);
		
		if (!scanInit.allowed) {
			return json({ error: scanInit.error || 'Quota exceeded' }, { status: 429 });
		}

		// Extract user ID and repository URL
		const uid = scanInit.uid;
		const repoUrl = scanInit.parsedRepoUrl;
		
		// Handle scan submission
		const result = await handleScanSubmission(repoUrl, uid);

		if (!result.success) {
			return json({ error: result.error || 'Failed to create scan' }, { status: 400 });
		}

		// Start analysis in background
		runBackgroundAnalysis(result.scanId, repoUrl).catch(err => {
			console.error('Background analysis error:', err);
		});

		return json({
			success: true,
			scanId: result.scanId,
			repoId: result.repoId
		});

	} catch (err) {
		console.error('Scan creation error:', err);
		return json(
			{ error: 'An error occurred while processing your request. Please try again.' },
			{ status: 500 }
		);
	}
}
