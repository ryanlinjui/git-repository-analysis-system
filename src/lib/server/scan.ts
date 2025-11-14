import { adminDb } from '$lib/server/firebase';
import { analyzeRepository, generateRepoId } from '$lib/server/analyzer';
import { parseGitUrl } from '$lib/server/git-utils';
import { ScanStatus } from '$lib/schema/scan';

interface User {
	uid: string;
	email?: string;
}

export interface ScanCreationResult {
	success: boolean;
	scanId: string;
	repoId: string;
	error?: string;
}

/**
 * Create a scan record in Firestore
 */
export async function handleScanSubmission(
	repoUrl: string,
	user: User | null,
	hashedIp: string
): Promise<ScanCreationResult> {
	try {
		const parsed = parseGitUrl(repoUrl);
		if (!parsed) {
			return {
				success: false,
				scanId: '',
				repoId: '',
				error: 'Invalid GitHub repository URL'
			};
		}

		const userId = user?.uid || `anonymous-${hashedIp}`;
		const repoId = generateRepoId(repoUrl);
		const repoFullName = `${parsed.owner}/${parsed.name}`;

		const scansRef = adminDb.collection('scans');
		const scanRef = scansRef.doc();
		const scanId = scanRef.id;
		
		const now = new Date();
		await scanRef.set({
			scanId,
			userId,
			repoId,
			repoFullName,
			isPublic: true,
			status: ScanStatus.QUEUED,
			progress: 0,
			queuedAt: now,
			createdAt: now,
			updatedAt: now
		});

		return { success: true, scanId, repoId };
	} catch (err) {
		console.error('Scan submission error:', err);
		return {
			success: false,
			scanId: '',
			repoId: '',
			error: err instanceof Error ? err.message : 'Unknown error'
		};
	}
}

/**
 * Run background analysis for a scan
 */
export async function runBackgroundAnalysis(
	scanId: string,
	repoUrl: string,
	geminiApiKey: string
): Promise<void> {
	const scanRef = adminDb.collection('scans').doc(scanId);
	const repoId = generateRepoId(repoUrl);
	
	// Helper: Check if scan was cancelled
	const isCancelled = async (): Promise<boolean> => {
		const scanDoc = await scanRef.get();
		const data = scanDoc.data();
		return data?.status === ScanStatus.FAILED && data?.errorCode === 'CANCELLED';
	};
	
	try {
		// Check if already cancelled before starting
		if (await isCancelled()) {
			console.log('Scan was cancelled before analysis started');
			return;
		}

		// Update to running
		await scanRef.update({
			status: ScanStatus.RUNNING,
			startedAt: new Date(),
			progress: 0,
			updatedAt: new Date()
		});

		// Run analysis with cancellation checks
		let cancelRequested = false;
		
		try {
			const result = await analyzeRepository(repoUrl, geminiApiKey, async (progress: number) => {
				// Check if cancelled during analysis
				if (await isCancelled()) {
					if (!cancelRequested) {
						console.log('Scan cancelled at progress:', progress);
						cancelRequested = true;
					}
					// Don't throw error - just skip updating progress
					// This allows the analysis to complete gracefully
					return;
				}
				
				await scanRef.update({
					progress,
					updatedAt: new Date()
				});
			});

			// If cancel was requested during analysis, don't save results
			if (cancelRequested) {
				console.log('Analysis was cancelled, discarding results...');
				return;
			}

			// Final cancellation check before saving results
			if (await isCancelled()) {
				console.log('Scan was cancelled before saving results');
				return;
			}

			// Save repository data
			const repoRef = adminDb.collection('repository').doc(repoId);
			const { repoId: _, ...dataWithoutId } = result;
			await repoRef.set({ repoId, ...dataWithoutId });

			// Mark scan as succeeded
			await scanRef.update({
				status: ScanStatus.SUCCEEDED,
				progress: 100,
				finishedAt: new Date(),
				updatedAt: new Date()
			});
		} catch (analysisError) {
			// If analysis itself fails (not cancellation)
			console.error('Analysis execution error:', analysisError);
			
			// Check if it was cancelled
			if (await isCancelled()) {
				console.log('Analysis error occurred during cancellation, keeping CANCELLED status');
				return;
			}
			
			// Otherwise, mark as failed
			throw analysisError;
		}
	} catch (err) {
		console.error('Background analysis error:', err);
		
		// Don't overwrite cancellation status
		const cancelled = await isCancelled();
		if (!cancelled) {
			await scanRef.update({
				status: ScanStatus.FAILED,
				errorCode: 'ANALYSIS_ERROR',
				errorMessage: err instanceof Error ? err.message : 'Unknown error',
				finishedAt: new Date(),
				updatedAt: new Date()
			});
		} else {
			console.log('Error occurred during cancelled scan, keeping CANCELLED status');
		}
	}
}
