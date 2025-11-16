import { writable } from 'svelte/store';
import { db } from '$lib/firebase';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import type { Scan } from '$lib/schema/scan';
import { toDate } from '$lib/utils/date';

// Active scan state
const activeScan = writable<Scan | null>(null);
const loading = writable(false);
const error = writable<string | null>(null);

// Current listener
let scanUnsubscribe: Unsubscribe | null = null;

/**
 * Start listening to a scan by ID
 */
export function watchScan(scanId: string): void {
	// Clean up previous listener
	if (scanUnsubscribe) {
		scanUnsubscribe();
		scanUnsubscribe = null;
	}

	// Reset states
	activeScan.set(null);
	loading.set(true);
	error.set(null);

	// Listen to scan document
	scanUnsubscribe = onSnapshot(
		doc(db, 'scans', scanId),
		(snapshot) => {
			if (!snapshot.exists()) {
				error.set('Scan not found');
				loading.set(false);
				return;
			}

			const scanData = snapshot.data();
			const scan: Scan = {
				scanId: snapshot.id,
				...scanData,
				queuedAt: toDate(scanData.queuedAt),
				startedAt: toDate(scanData.startedAt),
				finishedAt: toDate(scanData.finishedAt),
				createdAt: toDate(scanData.createdAt),
				updatedAt: toDate(scanData.updatedAt)
			} as Scan;

			activeScan.set(scan);
			loading.set(false);
		},
		(err) => {
			console.error('Error listening to scan:', err);
			error.set('Failed to load scan data');
			loading.set(false);
		}
	);
}

/**
 * Stop listening to the current scan
 */
export function unwatchScan(): void {
	if (scanUnsubscribe) {
		scanUnsubscribe();
		scanUnsubscribe = null;
	}
	activeScan.set(null);
	loading.set(false);
	error.set(null);
}

// Export stores
export { activeScan, loading, error };
