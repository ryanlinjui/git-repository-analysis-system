import { z } from 'zod';

/**
 * Custom Zod schema for Firestore Timestamp
 * Accepts both Firestore Timestamp objects and Date objects
 */
export const Timestamp = z.union([
	z.object({
		seconds: z.number(),
		nanoseconds: z.number()
	}),
	z.date()
]);

export type Timestamp = z.infer<typeof Timestamp>;

/**
 * Helper to convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: Timestamp): Date {
	if (timestamp instanceof Date) {
		return timestamp;
	}
	return new Date(timestamp.seconds * 1000);
}

/**
 * Helper to format timestamp
 */
export function formatTimestamp(timestamp: Timestamp): string {
	const date = timestampToDate(timestamp);
	return date.toISOString();
}
