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
 * Scan error codes (stored as string in database)
 */
export const ScanErrorCode = {
	CLONE_FAILED: 'CLONE_FAILED',
	SCAN_SUBMISSION_FAILED: 'SCAN_SUBMISSION_FAILED',
	ANALYSIS_FAILED: 'ANALYSIS_FAILED',
	CANCELLED: 'CANCELLED',
	UNKNOWN: 'UNKNOWN'
} as const;

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
	startedAt: Timestamp.nullable(),
	finishedAt: Timestamp.nullable(),
	
	// Error handling (stored as string: 'CLONE_FAILED', 'ANALYSIS_FAILED', 'CANCELLED', 'UNKNOWN')
	errorCode: z.union([
		z.literal(ScanErrorCode.CLONE_FAILED),
		z.literal(ScanErrorCode.ANALYSIS_FAILED),
		z.literal(ScanErrorCode.CANCELLED),
		z.literal(ScanErrorCode.UNKNOWN)
	]).nullable(),
	
	createdAt: Timestamp,
	updatedAt: Timestamp
});

export type Scan = z.infer<typeof ScanSchema>;
