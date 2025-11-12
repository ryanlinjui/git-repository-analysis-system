import { z } from 'zod';
import { Timestamp } from './utils';

export const route = (uid: string) => `/dashboard/${uid}`;

/**
 * User Profile Schema
 * Stores authenticated user information
 */
export const UserSchema = z.object({
	uid: z.string().describe('User ID from Firebase Auth'),
	username: z.string().nullable().optional().describe('GitHub or Google username'),
	authProvider: z.enum(['github', 'google']).default('github'),
	
	// Simple quota tracking (stored directly in user document)
	// undefined = unlimited quota
	quota: z.object({
		limit: z.number().default(-1).describe('Daily scan limit. -1 = unlimited'),
		used: z.number().default(0).describe('Scans used today'),
		resetAt: Timestamp.describe('Next reset time (daily at midnight)')
	}).optional().describe('If undefined, user has unlimited scans'),
	
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
	hashedIp: z.string().describe('Hashed IP address'),
	quotaUsed: z.number().default(0).describe('Scans used today'),

	// Auto-cleanup
	expiresAt: Timestamp.describe('Auto-delete after 24 hours using Firestore TTL'),
	
	// Timestamps
	createdAt: Timestamp,
	updatedAt: Timestamp
});


export type User = z.infer<typeof UserSchema>;
export type AnonymousUser = z.infer<typeof AnonymousUserSchema>;
