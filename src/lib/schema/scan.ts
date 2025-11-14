import { z } from 'zod';
import { Timestamp } from './utils';

/**
 * Scan status enum (stored as number in database)
 */
export const ScanStatus = {
	QUEUED: 0,
	RUNNING: 1,
	SUCCEEDED: 2,
	FAILED: 3
} as const;

export type ScanStatusValue = (typeof ScanStatus)[keyof typeof ScanStatus];

/**
 * Scan Schema
 * Main scan record tracking the analysis process
 */
export const ScanSchema = z.object({
	scanId: z.string().describe('Unique scan ID (UUID)'),
	userId: z.string().describe('Authenticated User ID'),

	// Repository information
	repoId: z.string().describe('Unique repository identifier (hash of normalized URL)'),
	repoFullName: z.string().describe('Full repository name, e.g., "owner/repo-name"'),
	
	// Sharing
	isPublic: z.boolean().default(false).describe('Whether this scan can be shared publicly'),

    // Status tracking (stored as number)
	status: z.union([
		z.literal(ScanStatus.QUEUED),
		z.literal(ScanStatus.RUNNING),
		z.literal(ScanStatus.SUCCEEDED),
		z.literal(ScanStatus.FAILED)
	]).describe('Scan status: 0=queued, 1=running, 2=succeeded, 3=failed'),

    // Progress tracking
	progress: z.number().min(0).max(100).default(0).describe('Scan progress percentage'),

	// Timestamps
	queuedAt: Timestamp,
	startedAt: Timestamp.nullable().optional(),
	finishedAt: Timestamp.nullable().optional(),
	
	// Error handling
	errorCode: z.enum([
        'INVALID_URL',           // Malformed repository URL
        'REPO_NOT_FOUND',        // Repository doesn't exist
        'REPO_PRIVATE',          // Repository is private/inaccessible
        'CLONE_FAILED',          // Failed to clone repository
        'TIMEOUT',               // Scan exceeded time limit
        'REPO_TOO_LARGE',        // Repository exceeds size limit
        'ANALYSIS_FAILED',       // Analysis process failed
        'RATE_LIMIT_EXCEEDED',   // User exceeded rate limit
        'CANCELLED',             // Scan cancelled by user
        'UNKNOWN'                // Unknown error
    ]).nullable().optional(),
	errorMessage: z.string().nullable().optional(),
	retryCount: z.number().default(0).optional(),
	
	createdAt: Timestamp,
	updatedAt: Timestamp
});

export type Scan = z.infer<typeof ScanSchema>;
