import { adminAuth } from '$lib/server/firebase';
import { type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('session');

	// No session cookie, user is not authenticated
	if (!sessionCookie) {
		event.locals.user = null;
	} else {
		try {
			// Verify the session cookie and get the user's claims
			const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
			event.locals.user = decodedClaims;
		} catch (error) {
			console.log('Session verification failed:', error);
			// Session cookie is invalid/expired
			event.locals.user = null;
			event.cookies.delete('session', { path: '/' });
			
			// Redirect to home if trying to access protected routes
			if (event.url.pathname.startsWith('/dashboard') || 
			    event.url.pathname.startsWith('/repository')) {
				return new Response(null, {
					status: 302,
					headers: {
						location: '/',
						'set-cookie': `session=; Path=/; Expires=${new Date(0)}`
					}
				});
			}
		}
	}

	// Protect API routes (except auth endpoints)
	if (
		event.url.pathname.startsWith('/api') &&
		!event.url.pathname.startsWith('/api/auth/signin') &&
		!event.url.pathname.startsWith('/api/auth/signout') &&
		!event.locals.user
	) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	return resolve(event);
};
