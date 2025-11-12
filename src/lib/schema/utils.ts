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
