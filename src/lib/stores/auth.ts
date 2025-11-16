import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { auth, db } from '$lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { GithubAuthProvider, signInWithPopup, type User as FirebaseUser } from 'firebase/auth';
import { writable, derived, type Readable } from 'svelte/store';
import type { User, Quota } from '$lib/schema/user';
import { initAnonymousUser, cleanupAnonymousUser } from './anonymous';

// User snapshot and display interface (for UI, derived from Firebase Auth)
export interface UserSnapshot extends Omit<User, 'createdAt' | 'updatedAt'> {
	displayName: string;
	email: string;
	photoURL: string;
	provider: string;
}

/**
 * Firebase Auth user store (single source of truth)
 * undefined = not yet determined, null = no user, FirebaseUser = logged in
 * Authenticated user quota store - reactive to Firestore changes
 */
export const firebaseUser = writable<FirebaseUser | null | undefined>(undefined);
export const authenticatedQuota = writable<Quota | null>(null);

// Firestore listener unsubscribe function
let unsubscribeAuthQuota: (() => void) | null = null;

// Derived: is user logged in (convenience boolean)
// Derived: authenticated user quota only
export const isLoggedIn = derived(firebaseUser, $user => !!$user);
export const quota = derived(
	authenticatedQuota,
	($authQuota) => $authQuota
);

// Derived: authenticated user object only
export const user: Readable<UserSnapshot | null> = derived(
	firebaseUser, 
	($firebaseUser) => {
		if (!$firebaseUser) {
			return null;
		}
	
		// Authenticated user
		const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=U&background=4F46E5&color=fff&size=128&bold=true';
		return {
			uid: $firebaseUser.uid,
			quota: undefined as any, // Will be populated by quota store
			displayName: $firebaseUser.displayName || $firebaseUser.email?.split('@')[0] || 'User',
			email: $firebaseUser.email || '',
			photoURL: $firebaseUser.photoURL || DEFAULT_AVATAR,
			provider: $firebaseUser.providerData?.[0]?.providerId?.replace('.com', '') || 'github'
		};
	}
);

/**
 * Listen to Firebase Auth state changes
 * Manages authenticated user quota subscription and anonymous user initialization
 */
auth.onAuthStateChanged((newUser) => {
	firebaseUser.set(newUser);
	
	if (newUser) {
		// User logged in - clean up anonymous user and subscribe to authenticated quota
		if (browser) {
			cleanupAnonymousUser();
		}
		
		if (unsubscribeAuthQuota) {
			unsubscribeAuthQuota();
		}
		
		unsubscribeAuthQuota = subscribeToAuthenticatedQuota(newUser.uid);
	} else {
		// No authenticated user
		if (unsubscribeAuthQuota) {
			unsubscribeAuthQuota();
			unsubscribeAuthQuota = null;
		}
	}
});

// Initialize anonymous user in browser when no Firebase auth user exists
if (browser) {
	firebaseUser.subscribe(($firebaseUser) => {
		if ($firebaseUser === null) {
			initAnonymousUser();
		}
	});
}

// Subscribe to authenticated user quota changes in Firestore
function subscribeToAuthenticatedQuota(uid: string): () => void {
	const docRef = doc(db, 'users', uid);
	
	return onSnapshot(
		docRef,
		(snapshot) => {
			if (snapshot.exists()) {
				const data = snapshot.data() as User;
				authenticatedQuota.set(data.quota);
			} else {
				authenticatedQuota.set(null);
			}
		},
		(error) => {
			console.error('[auth] Error listening to quota updates:', error);
			authenticatedQuota.set(null);
		}
	);
}

// Sign in with GitHub OAuth
export async function signInWithGithub() {
	const provider = new GithubAuthProvider();
	provider.setCustomParameters({ prompt: 'select_account' });
	
	// Sign out first to ensure account selection
	if (auth.currentUser) {
		await auth.signOut();
		await fetch('/api/auth/signout', { method: 'POST' });
	}
	
	const result = await signInWithPopup(auth, provider);
	const idToken = await result.user.getIdToken();
	
	const response = await fetch('/api/auth/signin', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ idToken })
	});

	if (!response.ok) {
		throw new Error('Failed to create session');
	}
}

// Sign out current user
export async function signOut() {
	if (auth.currentUser) {
		await auth.signOut();
	}
	await fetch('/api/auth/signout', { method: 'POST' });
	await goto('/');
}

// Navigate to user dashboard
export function goToDashboard(userId: string) {
	goto(`/dashboard/${userId}`);
}
