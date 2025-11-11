import { z } from 'zod';
import { Timestamp } from './utils';

export const userRoute = (uid: string) => `/users/${uid}`;

/**
 * User Profile Schema
 * Stores user information and preferences
 */
export const UserSchema = z.object({
	uid: z.string().describe('User ID from Firebase Auth'),
	username: z.string().nullable().optional().describe('GitHub or Google username'),
	authProvider: z.enum(['github', 'google']).default('github'),
	
	// Rate limiting tracking
	// If this field is undefined = unlimited quota (no restrictions)
	// If present with -1 = unlimited quota (explicit)
	// If present with positive number = limited quota
	scanDailyLimit: z.object({
		quota: z.number().describe('Daily scan limit. -1 = unlimited, undefined field = unlimited'),
		lastReset: Timestamp.optional()
	}).optional().describe('If undefined, user has unlimited scans'),
	
	// Timestamps
	createdAt: Timestamp,
	updatedAt: Timestamp,
	lastLoginAt: Timestamp.optional()
});

/**
 * Anonymous User Schema
 * Temporary users identified by session cookie or IP
 * Auto-deleted after 24 hours
 */
export const AnonymousUserSchema = z.object({
    uid: z.string().describe('Session cookie ID or hashed IP'),
    
    // Strict rate limiting for anonymous users
	scanDailyLimit: z.number().default(3).describe('Max 3 scans per day'),
	
	// Auto-cleanup
	expiresAt: Timestamp.describe('Auto-delete after 24 hours using Firestore TTL'),
	
	// Timestamps
    createdAt: Timestamp,
    updatedAt: Timestamp
});

export type User = z.infer<typeof UserSchema>;
export type AnonymousUser = z.infer<typeof AnonymousUserSchema>;