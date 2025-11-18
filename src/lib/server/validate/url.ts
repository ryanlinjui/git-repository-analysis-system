import { z } from 'zod';

/**
 * URL validation result
 */
export interface UrlValidationResult {
	isValid: boolean;
	repoUrl?: string;
	error?: string;
}

/**
 * Scan Request Schema with comprehensive validation
 */
export const ScanRequestSchema = z.object({
	repoUrl: z.string()
		.trim()
		.min(1, 'Repository URL is required')
		.url('Invalid URL format')
		.regex(
			/^https:\/\//,
			'Server: URL must use HTTPS protocol'
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
			{ message: 'Server: URL contains invalid characters' }
		)
		.refine(
			(url) => {
				// SSRF Protection: Prevent localhost and private IP addresses
				const BLOCKED_HOSTS = [
					/localhost/i,
					/127\.0\.0\./,
					/192\.168\./,
					/10\.\d+\.\d+\.\d+/,
					/172\.(1[6-9]|2[0-9]|3[0-1])\./,
					/0\.0\.0\.0/,
					/::1/,
					/file:\/\//i
				];
				return !BLOCKED_HOSTS.some(pattern => pattern.test(url));
			},
			{ message: 'Server: URL is blocked for security reasons' }
		)
});

/**
 * Validate repository URL from request body
 */
export function validateRepoUrl(body: any): UrlValidationResult {
	try {
		const validation = ScanRequestSchema.safeParse(body);
		
		if (!validation.success) {
			const firstError = validation.error.issues[0];
			return {
				isValid: false,
				error: firstError.message
			};
		}
		
		return {
			isValid: true,
			repoUrl: validation.data.repoUrl
		};
	} catch (error) {
		return {
			isValid: false,
			error: 'Invalid request body'
		};
	}
}
