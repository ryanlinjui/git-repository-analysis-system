import { db } from '$lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { writable } from 'svelte/store';
import type { Scan } from '$lib/schema/scan';
import type { AnonymousUser, Quota } from '$lib/schema/user';

// LocalStorage key for anonymous user UID
const ANONYMOUS_UID_KEY = 'anonymous_uid';

// Anonymous user UID store (fetched from API based on IP)
// Anonymous user quota store
export const anonymousUid = writable<string | null>(null);
export const anonymousQuota = writable<Quota | null>(null);

// Firestore unsubscribe function
let unsubscribeQuota: (() => void) | null = null;

/**
 * Get the last scan for an anonymous user from Firestore
 * Queries the scans collection for the most recent scan by this user
 */
export async function get_last_anonymous_scan(anonymousUid: string): Promise<string | null> {
	try {
		const scansRef = collection(db, 'scans');
		const q = query(
			scansRef,
			where('userId', '==', anonymousUid),
			orderBy('createdAt', 'desc'),
			limit(1)
		);
		
		const querySnapshot = await getDocs(q);
		
		if (querySnapshot.empty) {
			return null;
		}
		
		const lastScan = querySnapshot.docs[0].data() as Scan;
		return lastScan.scanId;
		
	} catch (error) {
		console.error('Error fetching last anonymous scan:', error);
		return null;
	}
}

/**
 * Get anonymous user UID
 * First checks localStorage, then fetches from API if needed
 * The UID is generated based on the client's IP address and cached in localStorage
 */
export async function get_anonymous_uid(): Promise<string | null> {
	// Check if browser environment
	if (typeof window === 'undefined') {
		return null;
	}

	// Try to get from localStorage first
	const cachedUid = localStorage.getItem(ANONYMOUS_UID_KEY);
	if (cachedUid) {
		return cachedUid;
	}

	// Not in localStorage, fetch from API
	try {
		const response = await fetch('/api/anonymous');
		const data = await response.json();
		
		if (!data.success || !data.uid) {
			console.error('Failed to get anonymous UID:', data.error);
			return null;
		}
		
		// Cache in localStorage for future use
		localStorage.setItem(ANONYMOUS_UID_KEY, data.uid);
		
		return data.uid;
		
	} catch (error) {
		console.error('Error fetching anonymous UID:', error);
		return null;
	}
}

/**
 * Clear the cached anonymous UID from localStorage
 * Useful when user signs in or wants to reset their anonymous session
 */
export function clear_anonymous_uid(): void {
	if (typeof window !== 'undefined') {
		localStorage.removeItem(ANONYMOUS_UID_KEY);
	}
}

// Subscribe to anonymous user quota changes in Firestore
function subscribeToAnonymousQuota(uid: string): () => void {
	const docRef = doc(db, 'anonymous_users', uid);
	
	return onSnapshot(
		docRef,
		(snapshot) => {
			if (snapshot.exists()) {
				const data = snapshot.data() as AnonymousUser;
				anonymousQuota.set(data.quota);
			} else {
				// Document doesn't exist yet - will be created on first scan
				anonymousQuota.set(null);
			}
		},
		(error) => {
			console.error('Error listening to anonymous quota updates:', error);
			anonymousQuota.set(null);
		}
	);
}

/**
 * Initialize anonymous user system
 * Fetches UID from API (or localStorage cache) and subscribes to quota updates
 * Call this when user is not authenticated
 * Note: Should only be called in browser environment (caller's responsibility)
 */
export async function initAnonymousUser(): Promise<void> {
	try {
		const uid = await get_anonymous_uid();
		
		if (uid) {
			anonymousUid.set(uid);
			
			// Unsubscribe from any previous listener
			if (unsubscribeQuota) {
				unsubscribeQuota();
				unsubscribeQuota = null;
			}
			
			// Subscribe to quota updates
			unsubscribeQuota = subscribeToAnonymousQuota(uid);
		} else {
			anonymousUid.set(null);
			anonymousQuota.set(null);
		}
	} catch (err) {
		console.error('[initAnonymousUser] Error:', err);
		anonymousUid.set(null);
		anonymousQuota.set(null);
	}
}

/**
 * Cleanup anonymous user subscription
 * Call this when user logs in
 */
export function cleanupAnonymousUser(): void {
	if (unsubscribeQuota) {
		unsubscribeQuota();
		unsubscribeQuota = null;
	}
	
	anonymousUid.set(null);
	anonymousQuota.set(null);
}
