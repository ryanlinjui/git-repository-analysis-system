/**
 * Get current date/time
 * Centralized for consistency and testing
 */
export function now(): Date {
	return new Date();
}

/**
 * Convert Firestore Timestamp to Date
 * Handles multiple input formats:
 * - Firestore Timestamp (has toDate method)
 * - Plain Firestore Timestamp object ({ seconds, nanoseconds })
 * - JavaScript Date object
 * - null/undefined
 */
export function toDate(timestamp: Date | { toDate(): Date } | { seconds: number; nanoseconds: number } | null | undefined): Date | null {
	if (!timestamp) return null;
	if (timestamp instanceof Date) return timestamp;
	if ('toDate' in timestamp && typeof timestamp.toDate === 'function') return timestamp.toDate();
	if ('seconds' in timestamp && typeof timestamp.seconds === 'number') {
		return new Date(timestamp.seconds * 1000);
	}
	return null;
}

/**
 * Convert Firestore Timestamp to Date (optional version)
 * Returns undefined instead of null for better compatibility with some interfaces
 */
export function toDateOptional(timestamp: any): Date | undefined {
	if (!timestamp) return undefined;
	if (timestamp instanceof Date) return timestamp;
	return timestamp.toDate?.();
}

/**
 * Format relative time (e.g., "2 minutes ago", "1 hour ago")
 * Handles Firestore Timestamps and Date objects
 */
export function formatRelativeTime(date: any): string {
	let d: Date;
	
	if (date instanceof Date) {
		d = date;
	} else if (date?.toDate) {
		d = date.toDate();
	} else if (date?.seconds) {
		d = new Date(date.seconds * 1000);
	} else {
		return 'Unknown';
	}
	
	const currentTime = now();
	const diff = currentTime.getTime() - d.getTime();
	
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	
	if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
	if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
	if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
	return 'Just now';
}

/**
 * Calculate time remaining until a future date
 * Returns the difference in milliseconds, or null if already passed
 */
export function getTimeUntilDate(futureDate: Date | null | undefined): number | null {
	if (!futureDate) return null;
	
	const currentTime = now();
	const diff = futureDate.getTime() - currentTime.getTime();
	
	return diff > 0 ? diff : null;
}

/**
 * Format time until reset in a compact format (e.g., "2h 30m", "45m", "10s")
 * Returns human-readable countdown string
 */
export function formatTimeUntilReset(resetAt: Date | null | undefined): string {
	const diff = getTimeUntilDate(resetAt);
	
	if (diff === null) {
		return 'Resetting...';
	}
	
	// Convert milliseconds to a readable format
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	
	if (days > 0) {
		const remainingHours = hours % 24;
		const remainingMinutes = minutes % 60;
		const remainingSeconds = seconds % 60;
		return `${days}d ${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s`;
	}
	if (hours > 0) {
		const remainingMinutes = minutes % 60;
		const remainingSeconds = seconds % 60;
		return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
	}
	if (minutes > 0) {
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	}
	return `${seconds}s`;
}


/**
 * Get timestamp from date for sorting
 * Accepts Date, Firestore Timestamp, or plain object with seconds/nanoseconds
 */
export function getTimestamp(date: any): number {
	if (!date) return 0;
	
	// Convert to timestamp
	if (date instanceof Date) {
		return date.getTime();
	} else if (typeof date === 'object' && 'seconds' in date) {
		// Plain Firestore timestamp object
		return date.seconds * 1000;
	}
	
	return 0;
}
