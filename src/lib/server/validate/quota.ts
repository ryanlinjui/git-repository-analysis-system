import { adminDb } from '$lib/server/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { now, toDate,  } from '$lib/utils/date';
import { ANONYMOUS_USER_QUOTA_LIMIT, USER_QUOTA_LIMIT, ANONYMOUS_QUOTA_RESET_TIME } from '$lib/schema/user'

// Reset result with updated quota data for Firestore
export interface QuotaResetResult {
	shouldReset: boolean;
	newQuota?: {
		used: number;
		resetAt: Date;
	};
}

// Calculate next reset time (24 hours from now)
export function getNextResetTime(): Date {
	return new Date(now().getTime() + ANONYMOUS_QUOTA_RESET_TIME);
}

/**
 * Check if daily quota needs reset and return reset data
 * This handles the daily reset logic for anonymous users
 */
export function checkDailyReset(quotaData: any): QuotaResetResult {
	const resetAt = toDate(quotaData.resetAt);
	
	// Unlimited quota (no resetAt) never resets
	if (!resetAt) {
		return { shouldReset: false };
	}
	
	// Check if current time has passed the reset time
	if (now() >= resetAt) {
		return {
			shouldReset: true,
			newQuota: {
				used: 1,
				resetAt: getNextResetTime()
			}
		};
	}
	
	return { shouldReset: false };
}


// Quota check result
export interface QuotaCheckResult {
	allowed: boolean;
	error?: string;
}

// Check and update quota for anonymous users 
export async function checkAnonymousQuota(uid: string): Promise<QuotaCheckResult> {
	const anonymousRef = adminDb.collection('anonymous_users').doc(uid);
	const anonymousDoc = await anonymousRef.get();
	const timestamp = now();

	if (!anonymousDoc.exists) {
		// Create new anonymous user record with initial quota
		await anonymousRef.set({
			uid,
			quota: {
				used: 1,
				limit: ANONYMOUS_USER_QUOTA_LIMIT,
				resetAt: getNextResetTime()
			},
			createdAt: timestamp,
			updatedAt: timestamp
		});

		return { allowed: true };
	}

	// Check quota for existing anonymous user
	const anonymousData = anonymousDoc.data();
	if (!anonymousData?.quota) {
		return { allowed: false, error: 'Invalid quota data' };
	}

	// Check if daily reset is needed
	const resetResult = checkDailyReset(anonymousData.quota);
	
	if (resetResult.shouldReset && resetResult.newQuota) {
		// Reset daily quota
		await anonymousRef.update({
			'quota.used': resetResult.newQuota.used,
			'quota.resetAt': resetResult.newQuota.resetAt,
			updatedAt: now()
		});

		return { allowed: true };
	}

	// Check if quota exceeded
	if (anonymousData.quota.used >= anonymousData.quota.limit) {
		return {
			allowed: false,
			error: `Daily scan limit exceeded. You have used ${anonymousData.quota.used}/${anonymousData.quota.limit} scans today. Sign in for unlimited scans.`
		};
	}

	// Increment quota
	await anonymousRef.update({
		'quota.used': FieldValue.increment(1),
		updatedAt: now()
	});

	return { allowed: true };
}

/**
 * Check and update quota for authenticated users
 * Note: User document is normally created during sign-in, but we handle edge cases
 */
export async function checkAuthenticatedQuota(uid: string): Promise<QuotaCheckResult> {
	const userRef = adminDb.collection('users').doc(uid);
	const timestamp = now();

	// Check if user document exists
	const userDoc = await userRef.get();

	if (!userDoc.exists) {
		// User document doesn't exist - create it
		// This handles race conditions or manually deleted users
		await userRef.set({
			uid,
			quota: {
				used: 1,
				limit: USER_QUOTA_LIMIT,
			},
			createdAt: timestamp,
			updatedAt: timestamp
		});
	} else {
		// User exists - just increment usage
		await userRef.update({
			'quota.used': FieldValue.increment(1),
			updatedAt: timestamp
		});
	}

	return { allowed: true };
}

// Check and update quota based on user authentication status
export async function checkAndUpdateQuota(
	uid: string,
	isAuthenticated: boolean
): Promise<QuotaCheckResult> {
	if (isAuthenticated) {
		return await checkAuthenticatedQuota(uid);
	} else {
		return await checkAnonymousQuota(uid);
	}
}
