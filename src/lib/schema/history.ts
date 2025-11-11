import { z } from 'zod';
import { Timestamp } from './utils';

export const historyRoute = (userId: string) => `/users/${userId}/history`;

/**
 * User Scan History Item
 * Lightweight reference to user's scans for dashboard listing
 */
export const HistoryItemSchema = z.object({
	scanId: z.string(),
	shareToken: z.string(),
	repoUrl: z.string(),
	repoName: z.string(),
	status: z.enum(['queued', 'running', 'succeeded', 'failed']),
	timestamp: Timestamp,
	tags: z.array(z.string()).default([]).optional(),
	isFavorite: z.boolean().default(false).optional()
});

export type HistoryItem = z.infer<typeof HistoryItemSchema>;

/**
 * User History Collection
 * Stored as subcollection under user document
 */
export const UserHistorySchema = z.object({
	userId: z.string(),
	items: z.array(HistoryItemSchema),
	totalScans: z.number().default(0),
	lastScanAt: Timestamp.nullable().optional(),
	updatedAt: Timestamp
});

export type UserHistory = z.infer<typeof UserHistorySchema>;
