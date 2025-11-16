import { writable, derived } from 'svelte/store';
import { firebaseUser } from './auth';
import { db } from '$lib/firebase';
import { collection, query, where, orderBy, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import type { Scan } from '$lib/schema/scan';
import { toDate } from '$lib/utils/date';

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
				// Convert Firestore Timestamps to Dates using centralized utility
				createdAt: toDate(data.createdAt),
				updatedAt: toDate(data.updatedAt),
				queuedAt: toDate(data.queuedAt),
				startedAt: toDate(data.startedAt),
				finishedAt: toDate(data.finishedAt)
			} as Scan;
		});
	
		rawScanHistory.set(scans);
	});
});

// Export scan history store
export const scanHistory = derived(rawScanHistory, ($history) => $history);
