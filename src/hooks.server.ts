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
			event.cookies.delete('session', { 
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'strict'
			});
			
			// Redirect to home if trying to access protected routes
			if (event.url.pathname.startsWith('/dashboard') || 
			    event.url.pathname.startsWith('/repository')) {
				return new Response(null, {
					status: 302,
					headers: {
						location: '/'
					}
				});
			}
		}
	}

	// Protect API routes (except auth endpoints and scan endpoint for anonymous users)
	if (
		event.url.pathname.startsWith('/api') &&
		!event.url.pathname.startsWith('/api/auth/signin') &&
		!event.url.pathname.startsWith('/api/auth/signout') &&
		!event.url.pathname.startsWith('/api/scan') && // Allow anonymous scans
		!event.url.pathname.startsWith('/api/anonymous') && // Allow anonymous UID generation
		!event.locals.user
	) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	// Resolve the request with security headers
	const response = await resolve(event);
	
	// Add security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
	
	// Add CORS headers for API routes
	if (event.url.pathname.startsWith('/api')) {
		// In production, replace * with your actual domain
		const origin = event.request.headers.get('origin');
		const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:4173'];
		
		if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
			response.headers.set('Access-Control-Allow-Origin', origin);
		}
		
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		response.headers.set('Access-Control-Allow-Credentials', 'true');
	}

	return response;
};

