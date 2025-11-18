/**
 * Client-side URL validation
 * Mirrors server-side validation for immediate user feedback
 */

export interface ValidationResult {
	isValid: boolean;
	error?: string;
}

/**
 * Validate repository URL on the client side
 * This provides immediate feedback before making API calls
 */
export function validateRepoUrl(url: string): ValidationResult {
	// Check if URL is empty
	const trimmedUrl = url.trim();
	if (!trimmedUrl) {
		return {
			isValid: false,
			error: 'Client: Repository URL is required'
		};
	}

	// Check URL format
	try {
		const parsedUrl = new URL(trimmedUrl);
		// Only allow HTTPS protocol for security
		if (parsedUrl.protocol !== 'https:') {
			return {
				isValid: false,
				error: 'Client: URL must use HTTPS protocol'
			};
		}
	} catch {
		return {
			isValid: false,
			error: 'Client: Invalid URL format'
		};
	}

	// Check URL length
	if (trimmedUrl.length > 500) {
		return {
			isValid: false,
			error: 'Client: URL is too long'
		};
	}

	// Check for suspicious patterns
	const suspiciousPatterns = [
		'javascript:',
		'data:',
		'vbscript:',
		'<script',
		'onerror=',
		'onclick='
	];
	
	if (suspiciousPatterns.some(pattern => trimmedUrl.toLowerCase().includes(pattern))) {
		return {
			isValid: false,
			error: 'Client: URL contains invalid characters'
		};
	}

	// SSRF Protection: Prevent localhost and private IP addresses
	const blockedHosts = [
		/localhost/i,
		/127\.0\.0\./,
		/192\.168\./,
		/10\.\d+\.\d+\.\d+/,
		/172\.(1[6-9]|2[0-9]|3[0-1])\./,
		/0\.0\.0\.0/,
		/::1/,
		/file:\/\//i
	];

	if (blockedHosts.some(pattern => pattern.test(trimmedUrl))) {
		return {
			isValid: false,
			error: 'Client: URL is blocked for security reasons'
		};
	}

	return {
		isValid: true
	};
}
