import { json, type RequestEvent } from '@sveltejs/kit';
import { handleScanSubmission, runBackgroundAnalysis } from '$lib/server/scan';
import { checkAndUpdateQuota, getClientIp, hashIp } from '$lib/server/scanInit';
import { env } from '$env/dynamic/private';
import { z } from 'zod';

// Input validation schema
const ScanRequestSchema = z.object({
	repoUrl: z.string()
		.trim()
		.min(1, 'Repository URL is required')
		.url('Invalid URL format')
		.regex(
			/^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\//,
			'URL must be from GitHub, GitLab, or Bitbucket'
		)
		.max(500, 'URL is too long')
		.refine(
			(url) => {
				// Additional check: URL should not contain suspicious patterns
				const suspiciousPatterns = [
					'javascript:',
					'data:',
					'vbscript:',
					'<script',
					'onerror=',
					'onclick='
				];
				return !suspiciousPatterns.some(pattern => 
					url.toLowerCase().includes(pattern)
				);
			},
			{ message: 'URL contains invalid characters' }
		)
});

/**
 * POST /api/scan
 * Create a new repository scan
 */
export async function POST({ request, locals }: RequestEvent) {
	try {
		// Parse and validate request body
		const body = await request.json();
		
		// Validate input with Zod
		const validation = ScanRequestSchema.safeParse(body);
		
		if (!validation.success) {
			const firstError = validation.error.issues[0];
			return json({ 
				error: firstError.message 
			}, { status: 400 });
		}
		
		const { repoUrl } = validation.data;

		// Get user and client IP
		const user = locals.user ? { uid: locals.user.uid, email: locals.user.email } : null;
		const clientIp = getClientIp(request);
		const hashedIp = hashIp(clientIp);

		// Check and update quota (for both anonymous and authenticated users)
		const quotaCheck = await checkAndUpdateQuota(user, hashedIp);
		
		if (!quotaCheck.allowed) {
			return json({ error: quotaCheck.error || 'Quota exceeded' }, { status: 429 });
		}

		// Handle scan submission
		const result = await handleScanSubmission(repoUrl, user, hashedIp);

		if (!result.success) {
			return json({ error: result.error || 'Failed to create scan' }, { status: 400 });
		}

		// Start analysis in background
		const geminiApiKey = env.GOOGLE_GENAI_API_KEY || '';
		runBackgroundAnalysis(result.scanId, repoUrl, geminiApiKey).catch(err => {
			console.error('Background analysis error:', err);
		});

		return json({
			success: true,
			scanId: result.scanId,
			repoId: result.repoId
		});

	} catch (err) {
		console.error('Scan creation error:', err);
		// Don't expose internal error details to client
		return json(
			{ error: 'An error occurred while processing your request. Please try again.' },
			{ status: 500 }
		);
	}
}
