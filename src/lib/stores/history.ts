import { writable, derived } from 'svelte/store';
import { firebaseUser } from './auth';
import { db } from '$lib/firebase';
import { collection, query, where, orderBy, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import type { Scan } from '$lib/schema/scan';
import { Timestamp } from 'firebase/firestore';

// Raw scan history from Firestore
const rawScanHistory = writable<Scan[]>([]);

// Subscribe to user's scans
let historyUnsubscribe: Unsubscribe | null = null;

firebaseUser.subscribe(($firebaseUser) => {
	// Clean up previous listener
	if (historyUnsubscribe) {
		historyUnsubscribe();
		historyUnsubscribe = null;
	}

	// Clear history when user logs out
	if (!$firebaseUser) {
		rawScanHistory.set([]);
		return;
	}

	// Listen to authenticated user's scans
	const scansRef = collection(db, 'scans');
	const q = query(
		scansRef,
		where('userId', '==', $firebaseUser.uid),
		orderBy('createdAt', 'desc')
	);

	historyUnsubscribe = onSnapshot(q, (snapshot) => {
		const scans: Scan[] = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				...data,
				// Convert Firestore Timestamps to Dates
				createdAt: data.createdAt?.toDate?.() || data.createdAt,
				updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
				queuedAt: data.queuedAt?.toDate?.() || data.queuedAt,
				startedAt: data.startedAt?.toDate?.() || data.startedAt,
				finishedAt: data.finishedAt?.toDate?.() || data.finishedAt
			} as Scan;
		});
	
		rawScanHistory.set(scans);
	});
});

// Export scan history store
export const scanHistory = derived(rawScanHistory, ($history) => $history);

/**
 * Format date for display
 * Accepts Date, Firestore Timestamp, or plain object with seconds/nanoseconds
 */
export function formatDate(date: any): string {
	if (!date) return 'N/A';
	
	// Convert to Date object
	let d: Date;
	if (date instanceof Date) {
		d = date;
	} else if (date instanceof Timestamp) {
		d = date.toDate();
	} else if (typeof date === 'object' && 'seconds' in date) {
		// Plain Firestore timestamp object
		d = new Date(date.seconds * 1000);
	} else {
		return 'N/A';
	}
	
	const now = new Date();
	const diff = now.getTime() - d.getTime();
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (seconds < 60) return 'Just now';
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	
	return d.toLocaleDateString('en-US', { 
		month: 'short', 
		day: 'numeric',
		year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
	});
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
	} else if (date instanceof Timestamp) {
		return date.toDate().getTime();
	} else if (typeof date === 'object' && 'seconds' in date) {
		// Plain Firestore timestamp object
		return date.seconds * 1000;
	}
	
	return 0;
}
