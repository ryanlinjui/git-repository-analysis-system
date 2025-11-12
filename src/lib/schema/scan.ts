import { z } from 'zod';
import { Timestamp } from './utils';

/**
 * Scan Schema
 * Main scan record tracking the analysis process
 */
export const ScanSchema = z.object({
	scanId: z.string().describe('Unique scan ID (UUID)'),
	userId: z.string().describe('Authenticated User ID'),

	// Repository information
	repoId: z.string().describe('Unique repository identifier (hash of normalized URL)'),
	
	// Sharing
	isPublic: z.boolean().default(true).describe('Whether this scan can be shared publicly'),

    // Status tracking
	status: z.enum([
        'queued',        // Waiting to be processed
        'running',       // Currently being processed
        'succeeded',     // Completed successfully
        'failed'         // Failed with error
    ]),

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
        'UNKNOWN'                // Unknown error
    ]).nullable().optional(),
	errorMessage: z.string().nullable().optional(),
	retryCount: z.number().default(0).optional(),
	
	createdAt: Timestamp,
	updatedAt: Timestamp
});

export type Scan = z.infer<typeof ScanSchema>;
