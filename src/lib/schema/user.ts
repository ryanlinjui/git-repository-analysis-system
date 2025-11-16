import { z } from 'zod';
import { Timestamp } from './utils';

export const route = (uid: string) => `/dashboard/${uid}`;

// Quota limits
export const UNLIMITED_QUOTA_FLAG = -1; // -1 means unlimited
export const USER_QUOTA_LIMIT = UNLIMITED_QUOTA_FLAG; // user scans per day
export const ANONYMOUS_USER_QUOTA_LIMIT = 5; // anonymous scans per day
export const ANONYMOUS_QUOTA_RESET_TIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Quota Schema
 * Represents user quota information
 */
export const QuotaSchema = z.object({
	used: z.number().describe('Scans used today'),
	limit: z.number().describe('Daily scan limit. -1 = unlimited'),
	resetAt: Timestamp.nullable().describe('Next reset time (daily at midnight). Null for unlimited quota. Auto-delete after 24 hours using Firestore TTL if anonymous user.'),
});

/**
 * User Profile Schema
 * Stores minimal user information (most data comes from Firebase Auth)
 */
export const UserSchema = z.object({
	uid: z.string().describe('User ID from Firebase Auth'),
	quota: QuotaSchema.describe('User quota information'),

	// Timestamps
	createdAt: Timestamp,
	updatedAt: Timestamp
});

/**
 * Anonymous User Schema
 * Temporary users identified by IP hash
 * Auto-deleted after 24 hours
 */
export const AnonymousUserSchema = z.object({
	uid: z.string().describe('Hashed IP address as user ID'),
	quota: QuotaSchema.describe('Anonymous user quota information'),

	// Timestamps
	createdAt: Timestamp,
	updatedAt: Timestamp
});


export type User = z.infer<typeof UserSchema>;
export type AnonymousUser = z.infer<typeof AnonymousUserSchema>;
export type Quota = z.infer<typeof QuotaSchema>;
