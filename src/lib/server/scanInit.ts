import { adminDb } from '$lib/server/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { ANONYMOUS_USER_QUOTA_LIMIT, ANONYMOUS_QUOTA_RESET_TIME } from '$lib/schema/user';
import crypto from 'crypto';

/**
 * User type for scan initialization
 */
export interface ScanUser {
	uid: string;
	email?: string;
}

/**
 * Quota check result
 */
export interface QuotaCheckResult {
	allowed: boolean;
	error?: string;
	used?: number;
	limit?: number;
}

/**
 * Get client IP address from request headers
 */
export function getClientIp(request: Request): string {
	// Try various headers in order of preference
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		// x-forwarded-for can contain multiple IPs, take the first one
		return forwarded.split(',')[0].trim();
	}
	
	const realIp = request.headers.get('x-real-ip');
	if (realIp) {
		return realIp.trim();
	}
	
	// Fallback to a constant for local development
	return 'local-dev';
}

/**
 * Hash IP address for privacy with salt
 */
export function hashIp(ip: string): string {
	// Use a secret salt from environment variable for additional security
	const salt = process.env.IP_HASH_SALT || 'default-salt-change-in-production';
	return crypto.createHash('sha256').update(ip + salt).digest('hex');
}

/**
 * Check and update quota for anonymous users
 */
export async function checkAnonymousQuota(clientIp: string): Promise<QuotaCheckResult> {
	const hashedIp = clientIp;
	const anonymousRef = adminDb.collection('anonymous_users').doc(hashedIp);
	const anonymousDoc = await anonymousRef.get();
	const now = new Date();

	if (!anonymousDoc.exists) {
		// Create new anonymous user record
		const resetAt = new Date(now.getTime() + ANONYMOUS_QUOTA_RESET_TIME); // 24 hours from now

		await anonymousRef.set({
			hashedIp,
			quota: {
				used: 1,
				limit: ANONYMOUS_USER_QUOTA_LIMIT,
				resetAt
			},
			createdAt: now,
			updatedAt: now
		});

		return { 
			allowed: true,
			used: 1,
			limit: ANONYMOUS_USER_QUOTA_LIMIT
		};
	}

	// Check quota for existing anonymous user
	const anonymousData = anonymousDoc.data();
	if (!anonymousData?.quota) {
		return { allowed: false, error: 'Invalid quota data' };
	}

	const resetAt = anonymousData.quota.resetAt?.toDate?.() ?? anonymousData.quota.resetAt;
	
	// Check if quota needs reset (24 hours have passed)
	if (resetAt && now >= resetAt) {
		const newResetAt = new Date(now.getTime() + ANONYMOUS_QUOTA_RESET_TIME); // 24 hours from now
		
		await anonymousRef.update({
			'quota.used': 1,
			'quota.resetAt': newResetAt,
			updatedAt: now
		});

		return { 
			allowed: true,
			used: 1,
			limit: anonymousData.quota.limit
		};
	}

	// Check if quota exceeded
	if (anonymousData.quota.used >= anonymousData.quota.limit) {
		return {
			allowed: false,
			error: `Daily scan limit exceeded. You have used ${anonymousData.quota.used}/${anonymousData.quota.limit} scans today. Sign in for unlimited scans.`,
			used: anonymousData.quota.used,
			limit: anonymousData.quota.limit
		};
	}

	// Increment quota
	await anonymousRef.update({
		'quota.used': FieldValue.increment(1),
		updatedAt: now
	});

	return { 
		allowed: true,
		used: anonymousData.quota.used + 1,
		limit: anonymousData.quota.limit
	};
}

/**
 * Check and update quota for authenticated users
 */
export async function checkAuthenticatedQuota(user: ScanUser): Promise<QuotaCheckResult> {
	const userRef = adminDb.collection('users').doc(user.uid);
	const userDoc = await userRef.get();
	const now = new Date();

	if (!userDoc.exists) {
		// Create user record with unlimited quota (no resetAt needed)
		await userRef.set({
			uid: user.uid,
			email: user.email || null,
			quota: {
				used: 1,
				limit: -1 // Unlimited, no resetAt needed
			},
			createdAt: now,
			updatedAt: now
		});

		return { 
			allowed: true,
			used: 1,
			limit: -1
		};
	}

	// Check quota for existing users
	const userData = userDoc.data();
	if (!userData?.quota) {
		return { allowed: false, error: 'Invalid quota data' };
	}

	// Unlimited quota (-1)
	if (userData.quota.limit === -1) {
		await userRef.update({
			'quota.used': FieldValue.increment(1),
			updatedAt: now
		});
		return { 
			allowed: true,
			used: userData.quota.used + 1,
			limit: -1
		};
	}

	// Check if quota needs reset
	const resetAt = userData.quota.resetAt?.toDate?.() ?? userData.quota.resetAt;
	if (resetAt && now >= resetAt) {
		const newResetAt = new Date(now);
		newResetAt.setHours(24, 0, 0, 0);
		
		await userRef.update({
			'quota.used': 1,
			'quota.resetAt': newResetAt,
			updatedAt: now
		});

		return { 
			allowed: true,
			used: 1,
			limit: userData.quota.limit
		};
	}

	// Check if quota exceeded
	if (userData.quota.used >= userData.quota.limit) {
		return {
			allowed: false,
			error: 'Daily scan limit exceeded',
			used: userData.quota.used,
			limit: userData.quota.limit
		};
	}

	// Increment quota
	await userRef.update({
		'quota.used': FieldValue.increment(1),
		updatedAt: now
	});

	return { 
		allowed: true,
		used: userData.quota.used + 1,
		limit: userData.quota.limit
	};
}

/**
 * Check and update quota based on user authentication status
 * This is the main entry point for quota checking
 */
export async function checkAndUpdateQuota(
	user: ScanUser | null,
	clientIp: string
): Promise<QuotaCheckResult> {
	if (user) {
		return await checkAuthenticatedQuota(user);
	} else {
		return await checkAnonymousQuota(clientIp);
	}
}
