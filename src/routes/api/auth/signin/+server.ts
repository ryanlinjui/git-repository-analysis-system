import { adminAuth, adminDb } from '$lib/server/firebase';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { FieldValue } from 'firebase-admin/firestore';

const SESSION_EXPIRES_IN = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { idToken } = await request.json();

	try {
		// Verify the ID token and get user info
		const decodedToken = await adminAuth.verifyIdToken(idToken);
		const uid = decodedToken.uid;

		// Check if user exists in Firestore
		const userRef = adminDb.collection('users').doc(uid);
		const userDoc = await userRef.get();

		const now = FieldValue.serverTimestamp();

		if (!userDoc.exists) {
			// Create new user document (minimal data, rest from Firebase Auth)
			await userRef.set({
				uid,
				createdAt: now,
				updatedAt: now
			});
		} else {
			// Update existing user
			await userRef.update({
				updatedAt: now
			});
		}

		// Create session cookie
		const expiresIn = SESSION_EXPIRES_IN;
		const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

		// Set cookie options
		cookies.set('session', sessionCookie, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: expiresIn / 1000 // Convert from milliseconds to seconds
		});

		return json({ status: 'success' });
	} catch (error) {
		console.error('Error during sign in:', error);
		return json({ status: 'error', message: 'Unauthorized request' }, { status: 401 });
	}
};
