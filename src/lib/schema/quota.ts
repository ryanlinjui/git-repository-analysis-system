import { z } from 'zod';
import { Timestamp } from './utils';

export const quotaRoute = (key: string) => `/quotas/${key}`;

/**
 * Rate Limit Window
 */
export const RateLimitWindow = z.enum([
	'minute',
	'hour',
	'day',
	'month'
]);

export type RateLimitWindow = z.infer<typeof RateLimitWindow>;

/**
 * User Quota Schema
 * Tracks user's usage against their limits
 * Only created for users with limited quota
 */
export const UserQuotaSchema = z.object({
	userId: z.string(),
	
	// Current period usage
	scansToday: z.number().default(0),
	
	// Limits (-1 for unlimited)
	dailyLimit: z.number().default(-1).describe('-1 = unlimited, positive number = limited'),
	concurrentLimit: z.number().default(3),
	
	// Current state
	currentConcurrent: z.number().default(0),
	
	// Reset timestamps
	dailyResetAt: Timestamp,
	
	// Timestamps
	createdAt: Timestamp,
	updatedAt: Timestamp
});

export type UserQuota = z.infer<typeof UserQuotaSchema>;

/**
 * Anonymous Rate Limit Schema
 * Multi-layered rate limiting for anonymous users
 * Combines multiple identifiers to prevent bypass
 * Auto-deleted after 24 hours using Firestore TTL policy
 */
export const AnonymousRateLimitSchema = z.object({
	// Primary identifier (session cookie)
	sessionId: z.string().describe('Session cookie ID'),
	
	// Backup identifiers for tracking
	ipHash: z.string().describe('Hashed IP address'),
	fingerprint: z.string().nullable().optional().describe('Browser fingerprint hash'),
	userAgent: z.string().nullable().optional().describe('User agent string'),
	
	// Rate limiting counters
	scansToday: z.number().default(0),
	scansThisHour: z.number().default(0),
	
	// Limits
	dailyLimit: z.number().default(3),
	hourlyLimit: z.number().default(1),
	
	// Tracking suspicious behavior
	cookieResets: z.number().default(0).describe('Number of times cookie was reset'),
	lastSeenFingerprint: z.string().nullable().optional(),
	
	// Auto-cleanup with TTL
	expiresAt: Timestamp.describe('Set to createdAt + 24 hours for Firestore TTL'),
	
	// Timestamps
	hourlyResetAt: Timestamp,
	dailyResetAt: Timestamp,
	firstSeenAt: Timestamp,
	
	createdAt: Timestamp,
	updatedAt: Timestamp
});

export type AnonymousRateLimit = z.infer<typeof AnonymousRateLimitSchema>;

/**
 * Global Rate Limit Schema
 * System-wide limits to prevent abuse
 */
export const GlobalRateLimitSchema = z.object({
	key: z.string().describe('Limit identifier (e.g., "global:scans:minute")'),
	window: RateLimitWindow,
	count: z.number().default(0),
	limit: z.number(),
	resetAt: Timestamp,
	createdAt: Timestamp,
	updatedAt: Timestamp
});

export type GlobalRateLimit = z.infer<typeof GlobalRateLimitSchema>;
