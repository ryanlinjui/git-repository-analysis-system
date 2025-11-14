import { goto } from '$app/navigation';
import { auth, db } from '$lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { GithubAuthProvider, signInWithPopup, type User as FirebaseUser } from 'firebase/auth';
import { writable, derived, type Readable } from 'svelte/store';
import { ANONYMOUS_USER_QUOTA_LIMIT, UNLIMITED_QUOTA_FLAG } from '$lib/schema/user';

// User data interface
export interface User {
	uid: string;
	displayName: string;
	email: string;
	photoURL: string;
	provider: string;
}

// Quota interface with computed fields
export interface Quota {
	used: number;
	limit: number;
	resetAt?: Date;
	hasQuota: boolean;
	remaining: number | typeof Infinity;
	isUnlimited: boolean;
}

/**
 * Get anonymous user hashed IP from last scan
 */
async function getAnonymousHashedIp(): Promise<string | null> {
	// Check if we're in browser environment
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return null;
	}
	
	try {
		// Try to get from localStorage first
		const lastScanId = localStorage.getItem('lastScanId');
		
		if (lastScanId) {
			const scanDoc = await getDoc(doc(db, 'scans', lastScanId));
			
			if (scanDoc.exists()) {
				const userId = scanDoc.data().userId;
				
				// userId format: "anonymous-{hashedIp}"
				if (userId && userId.startsWith('anonymous-')) {
					const hashedIp = userId.replace('anonymous-', '');
					return hashedIp;
				}
			}
		}
	} catch (err) {
		console.error('Error getting anonymous hashed IP:', err);
	}
	return null;
}

// Firebase Auth user (single source of truth)
// Start with undefined to ensure first auth state change triggers subscribers
export const firebaseUser = writable<FirebaseUser | null | undefined>(undefined);

// Quota store - directly from Firestore user document or anonymous_users collection
const rawQuota = writable<{ used: number; limit: number; resetAt?: Date } | null>(null);

// Derived quota with computed fields
export const quota: Readable<Quota> = derived(
	rawQuota,
	($rawQuota) => {
		if (!$rawQuota) {
			// Default for anonymous users before data loads
			return {
				used: 0,
				limit: ANONYMOUS_USER_QUOTA_LIMIT,
				hasQuota: true,
				remaining: ANONYMOUS_USER_QUOTA_LIMIT,
				isUnlimited: false
			};
		}

		const isUnlimited = $rawQuota.limit === UNLIMITED_QUOTA_FLAG;
		const remaining = isUnlimited ? Infinity : Math.max(0, $rawQuota.limit - $rawQuota.used);

		return {
			...$rawQuota,
			hasQuota: isUnlimited || remaining > 0,
			remaining,
			isUnlimited
		};
	}
);

// Derived: is user logged in
export const isLoggedIn = derived(firebaseUser, $user => !!$user);

// Derived: unified user object with all user information
export const user: Readable<User | null> = derived(firebaseUser, $firebaseUser => {
	if (!$firebaseUser) {
		return null;
	}
	
	const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=U&background=4F46E5&color=fff&size=128&bold=true';
	
	return {
		uid: $firebaseUser.uid,
		displayName: $firebaseUser.displayName || $firebaseUser.email?.split('@')[0] || 'User',
		email: $firebaseUser.email || '',
		photoURL: $firebaseUser.photoURL || DEFAULT_AVATAR,
		provider: $firebaseUser.providerData?.[0]?.providerId?.replace('.com', '') || 'github'
	};
});

// Listen to user quota changes from Firestore
let quotaUnsubscribe: (() => void) | null = null;

firebaseUser.subscribe(async ($firebaseUser) => {
	// Clean up previous listener
	if (quotaUnsubscribe) {
		quotaUnsubscribe();
		quotaUnsubscribe = null;
	}

	// Skip if auth hasn't initialized yet
	if ($firebaseUser === undefined) {
		return;
	}

	if (!$firebaseUser) {
		// Anonymous user - try to get hashed IP from last scan
		const hashedIp = await getAnonymousHashedIp();
		
		if (hashedIp) {
			const anonymousRef = doc(db, 'anonymous_users', hashedIp);
			quotaUnsubscribe = onSnapshot(
				anonymousRef,
				(snapshot) => {
					if (snapshot.exists()) {
						const data = snapshot.data();
						if (data?.quota) {
							rawQuota.set({
								used: data.quota.used,
								limit: data.quota.limit,
								resetAt: data.quota.resetAt?.toDate?.()
							});
						}
					} else {
						// No data yet, use defaults
						rawQuota.set(null);
					}
				},
				(error) => {
					console.error('Error listening to anonymous quota:', error);
					rawQuota.set(null);
				}
			);
		} else {
			// First time user, no scan yet
			rawQuota.set(null);
		}
		return;
	}
	
	// Authenticated user detected
	const userRef = doc(db, 'users', $firebaseUser.uid);
	quotaUnsubscribe = onSnapshot(
		userRef,
		(snapshot) => {
			if (snapshot.exists()) {
				const data = snapshot.data();
				if (data?.quota) {
					rawQuota.set({
						used: data.quota.used,
						limit: data.quota.limit,
						resetAt: data.quota.resetAt?.toDate?.()
					});
				} else {
					// User document exists but no quota field, set unlimited
					rawQuota.set({
						used: 0,
						limit: UNLIMITED_QUOTA_FLAG,
						resetAt: undefined
					});
				}
			} else {
				// User document doesn't exist yet (will be created on first scan)
				// Set unlimited quota for authenticated users
				rawQuota.set({
					used: 0,
					limit: UNLIMITED_QUOTA_FLAG,
					resetAt: undefined
				});
			}
		},
		(error) => {
			console.error('Error listening to authenticated user quota:', error);
			// On error, still set unlimited for authenticated users
			rawQuota.set({
				used: 0,
				limit: UNLIMITED_QUOTA_FLAG,
				resetAt: undefined
			});
		}
	);
});

// Listen to Firebase Auth state changes - trigger after auth is ready
auth.onAuthStateChanged((newUser) => {
	firebaseUser.set(newUser);
});

export async function signInWithGithub() {
	const provider = new GithubAuthProvider();
	
	// Force account selection by signing out first
	// This ensures user can always choose different account
	if (auth.currentUser) {
		try {
			await auth.signOut();
			await fetch('/api/auth/signout', { method: 'POST' });
		} catch (err) {
			console.error('Error signing out before new sign in:', err);
		}
	}
	
	// Force account selection prompt (prevents using already signed-in account)
	provider.setCustomParameters({
		prompt: 'select_account' // Force display of account selection screen
	});
	
	try {
		const result = await signInWithPopup(auth, provider);
		const idToken = await result.user.getIdToken();
		
		const response = await fetch('/api/auth/signin', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ idToken })
		});

		if (!response.ok) {
			throw new Error('Failed to create session');
		}
	} catch (error) {
		console.error('Error signing in with GitHub:', error);
		throw error;
	}
}

export async function signOut() {
	try {
		if (auth.currentUser) {
			await auth.signOut();
		}
		
		// Clear the session cookie
		await fetch('/api/auth/signout', { method: 'POST' });
		
		// Redirect to home page
		await goto('/');
	} catch (error) {
		console.error('Error signing out:', error);
	}
}

export function goToDashboard(userId: string) {
	goto(`/dashboard/${userId}`);
}
