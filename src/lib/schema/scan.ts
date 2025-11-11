import { z } from 'zod';
import { Timestamp } from './utils';

export const scanRoute = (scanId: string) => `/scans/${scanId}`;

/**
 * Scan status enum
 */
export const ScanStatus = z.enum([
	'queued',      // Waiting to be processed
	'running',     // Currently being processed
	'succeeded',   // Completed successfully
	'failed'       // Failed with error
]);

export type ScanStatus = z.infer<typeof ScanStatus>;

/**
 * Error codes for failed scans
 */
export const ScanErrorCode = z.enum([
	'INVALID_URL',           // Malformed repository URL
	'REPO_NOT_FOUND',        // Repository doesn't exist
	'REPO_PRIVATE',          // Repository is private/inaccessible
	'CLONE_FAILED',          // Failed to clone repository
	'TIMEOUT',               // Scan exceeded time limit
	'REPO_TOO_LARGE',        // Repository exceeds size limit
	'ANALYSIS_FAILED',       // Analysis process failed
	'RATE_LIMIT_EXCEEDED',   // User exceeded rate limit
	'UNKNOWN'                // Unknown error
]);

export type ScanErrorCode = z.infer<typeof ScanErrorCode>;

/**
 * Repository metadata
 */
export const RepoMetadataSchema = z.object({
	url: z.string().url(),
	owner: z.string(),
	name: z.string(),
	fullName: z.string(), // e.g., "facebook/react"
	provider: z.enum(['github', 'gitlab', 'bitbucket']),
	branch: z.string().default('main'),
	commitSha: z.string().nullable().optional(), // Latest commit analyzed
	stars: z.number().nullable().optional(),
	forks: z.number().nullable().optional(),
	lastUpdated: Timestamp.nullable().optional()
});

export type RepoMetadata = z.infer<typeof RepoMetadataSchema>;

/**
 * Scan Schema
 * Main scan record tracking the analysis process
 */
export const ScanSchema = z.object({
	id: z.string().describe('Unique scan ID (UUID)'),
	userId: z.string().nullable().describe('User ID if authenticated, null for anonymous'),
	
	// Repository information
	repoUrl: z.string().url(),
	repoMetadata: RepoMetadataSchema.nullable().optional(),
	
	// Status tracking
	status: ScanStatus,
	progress: z.number().min(0).max(100).default(0).optional(),
	
	// Timestamps
	queuedAt: Timestamp,
	startedAt: Timestamp.nullable().optional(),
	finishedAt: Timestamp.nullable().optional(),
	
	// Error handling
	errorCode: ScanErrorCode.nullable().optional(),
	errorMessage: z.string().nullable().optional(),
	retryCount: z.number().default(0).optional(),
	
	// Sharing
	shareToken: z.string().describe('Short hash for shareable URL'),
	isPublic: z.boolean().default(true),
	
	// Metadata
	ipAddress: z.string().nullable().optional(),
	userAgent: z.string().nullable().optional(),
	
	createdAt: Timestamp,
	updatedAt: Timestamp
});

export type Scan = z.infer<typeof ScanSchema>;

/**
 * Scan summary (for listing)
 */
export const ScanSummarySchema = ScanSchema.pick({
	id: true,
	userId: true,
	repoUrl: true,
	status: true,
	shareToken: true,
	queuedAt: true,
	finishedAt: true
}).extend({
	repoName: z.string().optional(),
	duration: z.number().optional() // in milliseconds
});

export type ScanSummary = z.infer<typeof ScanSummarySchema>;
