import { createHash } from 'crypto';
import { env } from '$env/dynamic/private';

/**
 * User identifier - either authenticated UID or hashed IP for anonymous
 */
export interface UserIdentifier {
	uid: string;
	isAuthenticated: boolean;
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
	const xForwardedFor = request.headers.get('x-forwarded-for');
	if (xForwardedFor) {
		return xForwardedFor.split(',')[0].trim();
	}

	const xRealIp = request.headers.get('x-real-ip');
	if (xRealIp) {
		return xRealIp;
	}

	// Fallback for local development
	return 'local-dev';
}

/**
 * Hash IP address for anonymous user identification
 */
export function hashIp(ip: string): string {
	const salt = env.IP_HASH_SALT || 'default-salt-change-in-production';
	return createHash('sha256').update(ip + salt).digest('hex');
}

/**
 * Get user identifier from request and locals
 * Returns either authenticated user UID or hashed IP for anonymous users
 */
export function getUserIdentifier(request: Request, locals: any): UserIdentifier {
	if (locals.user?.uid) {
		return {
			uid: locals.user.uid,
			isAuthenticated: true
		};
	}
	
	// Anonymous user - use hashed IP
	const clientIp = getClientIp(request);
	const hashedIp = hashIp(clientIp);
	
	return {
		uid: hashedIp,
		isAuthenticated: false
	};
}
