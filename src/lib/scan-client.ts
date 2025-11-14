import { db } from '$lib/firebase';
import { doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth } from '$lib/firebase';
import { ScanStatus } from '$lib/schema/scan';

export interface ScanCreationResult {
	success: boolean;
	scanId: string;
	repoId: string;
	error?: string;
}

export interface DeleteResult {
	success: boolean;
	error?: string;
}

export interface CancelResult {
	success: boolean;
	error?: string;
}

/**
 * Delete a scan (Client-side only)
 * Only allows deletion of own scans (authenticated users only)
 */
export async function deleteScan(scanId: string): Promise<DeleteResult> {
	try {
		const scanRef = doc(db, 'scans', scanId);
		const scanDoc = await getDoc(scanRef);

		if (!scanDoc.exists()) {
			return {
				success: false,
				error: 'Scan not found'
			};
		}

		const scanData = scanDoc.data();
		const currentUser = auth.currentUser;

		// Only authenticated users can delete scans
		if (!currentUser) {
			return {
				success: false,
				error: 'Please sign in to delete scans'
			};
		}

		// Check ownership
		if (scanData.userId !== currentUser.uid) {
			return {
				success: false,
				error: 'You can only delete your own scans'
			};
		}

		// Delete the scan
		await deleteDoc(scanRef);

		return {
			success: true
		};

	} catch (error) {
		console.error('Delete scan error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to delete scan'
		};
	}
}

/**
 * Cancel a running scan (Client-side only)
 * Marks the scan as failed with CANCELLED error code
 */
export async function cancelScan(scanId: string): Promise<CancelResult> {
	try {
		await updateDoc(doc(db, 'scans', scanId), {
			status: ScanStatus.FAILED,
			errorCode: 'CANCELLED',
			errorMessage: 'Scan cancelled by user',
			finishedAt: new Date(),
			updatedAt: new Date()
		});

		return {
			success: true
		};

	} catch (error) {
		console.error('Cancel scan error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to cancel scan'
		};
	}
}

/**
 * Submit a scan request via API (Client-side only)
 */
export async function submitScanRequest(repoUrl: string): Promise<ScanCreationResult> {
	try {
		const response = await fetch('/api/scan', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ repoUrl: repoUrl.trim() })
		});

		const data = await response.json();

		if (!response.ok) {
			return {
				success: false,
				scanId: '',
				repoId: '',
				error: data.error || 'Failed to create scan'
			};
		}

		// Store scanId in localStorage for anonymous quota tracking
		if (data.scanId) {
			localStorage.setItem('lastScanId', data.scanId);
		}

		return {
			success: true,
			scanId: data.scanId,
			repoId: data.repoId
		};

	} catch (error) {
		console.error('Submit scan request error:', error);
		return {
			success: false,
			scanId: '',
			repoId: '',
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}
