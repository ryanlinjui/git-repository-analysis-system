// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { DecodedIdToken } from 'firebase-admin/auth';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: DecodedIdToken | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
