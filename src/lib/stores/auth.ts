import { goto } from '$app/navigation';
import { auth } from '$lib/firebase';
import { GithubAuthProvider, signInWithPopup, type User as FirebaseUser } from 'firebase/auth';
import { writable, derived, type Readable } from 'svelte/store';

// User data interface
export interface User {
	uid: string;
	displayName: string;
	email: string;
	photoURL: string;
	provider: string;
}

// Firebase Auth user (single source of truth)
export const firebaseUser = writable<FirebaseUser | null>(null);

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

// Listen to Firebase Auth state changes
auth.onAuthStateChanged((newUser) => {
	console.log('Auth state changed:', newUser?.uid);
	firebaseUser.set(newUser);
});

export async function signInWithGithub() {
	const provider = new GithubAuthProvider();
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

