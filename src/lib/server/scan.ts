import { adminDb } from '$lib/server/firebase';
import { ScanStatus, ScanErrorCode } from '$lib/schema/scan';
import { now } from '$lib/utils/date';
import { analyzeRepository, generateRepoId } from '$lib/server/analyzer';
import { getLatestCommitSha } from '$lib/server/git-utils';
import { GOOGLE_GENAI_API_KEY } from './constants';
import type { Repository } from '$lib/schema/repository';

export interface ScanCreationResult {
	success: boolean;
	scanId: string;
	repoId: string;
	error?: string;
}

// Check if we can use cached analysis results and apply if available
async function checkAndApplySmartCache(
	repoUrl: string,
	scanRef: FirebaseFirestore.DocumentReference,
	repoRef: FirebaseFirestore.DocumentReference
): Promise<boolean> {
	console.log('🔍 Checking for cached analysis...');
	const existingRepoDoc = await repoRef.get();
	
	if (!existingRepoDoc.exists) {
		console.log('📦 First time analyzing this repository');
		return false;
	}
	
	const existingRepo = existingRepoDoc.data() as Repository;
	console.log('   ├─ Found cached analysis');
	console.log(`   └─ Cached commit: ${existingRepo.analyzedCommit}`);
	
	// Get latest commit SHA from remote
	const latestCommitSha = await getLatestCommitSha(repoUrl, existingRepo.metadata.branch);
	
	if (latestCommitSha && latestCommitSha === existingRepo.analyzedCommit) {
		console.log('✅ Repository unchanged - using cached results!');
		console.log(`   └─ Commit SHA: ${latestCommitSha}`);
		
		// Update scan metadata but use cached analysis
		await scanRef.update({
			repoFullName: existingRepo.metadata.fullName,
			status: ScanStatus.SUCCEEDED,
			progress: 100,
			finishedAt: now(),
			updatedAt: now()
		});
		
		// Update repository's scan metadata
		await repoRef.update({
			totalScans: (existingRepo.totalScans || 1) + 1,
			lastScannedAt: now(),
			updatedAt: now()
		});
		
		return true; // Cache was used
	}
	
	console.log('🔄 Repository has changed - running fresh analysis');
	if (latestCommitSha) {
		console.log(`   ├─ Old commit: ${existingRepo.analyzedCommit}`);
		console.log(`   └─ New commit: ${latestCommitSha}`);
	} else {
		console.log('   └─ Unable to verify commit SHA, re-analyzing to be safe');
	}
	
	return false; // Cache not used, need fresh analysis
}

// Create a scan record in Firestore
export async function handleScanSubmission(
	repoUrl: string,
	uid: string
): Promise<ScanCreationResult> {
	try {
		const userId = uid;
		const repoId = generateRepoId(repoUrl);

		const scansRef = adminDb.collection('scans');
		const scanRef = scansRef.doc();
		const scanId = scanRef.id;
		
		const timestamp = now();
		const tempRepoFullName = repoUrl.replace(/^https?:\/\//, '').replace(/\.git$/, '').split('/').slice(-2).join('/');

		await scanRef.set({
			scanId,
			userId,
			repoId,
			repoFullName: tempRepoFullName, // Temporary, will be updated after cloning
			status: ScanStatus.QUEUED,
			progress: 0,
			queuedAt: timestamp,
			createdAt: timestamp,
			updatedAt: timestamp
		});

		return { success: true, scanId, repoId };
	} catch (err) {
		console.error('Scan submission error:', err);
		return {
			success: false,
			scanId: '',
			repoId: '',
			error: ScanErrorCode.SCAN_SUBMISSION_FAILED
		};
	}
}

// Run background analysis for a scan
export async function runBackgroundAnalysis(
	scanId: string,
	repoUrl: string
): Promise<void> {
	const scanRef = adminDb.collection('scans').doc(scanId);
	const repoId = generateRepoId(repoUrl);
	const repoRef = adminDb.collection('repository').doc(repoId);
	
	// Check if scan was cancelled
	const isCancelled = async (): Promise<boolean> => {
		const scanDoc = await scanRef.get();
		if (!scanDoc.exists) {
			return false;
		}
		const data = scanDoc.data();
		return data?.status === ScanStatus.FAILED && data?.errorCode === ScanErrorCode.CANCELLED;
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
			startedAt: now(),
			progress: 0,
			updatedAt: now()
		});

		const usedCache = await checkAndApplySmartCache(repoUrl, scanRef, repoRef);
		if (usedCache) {
			return; // Skip analysis, used cached data
		}

		// Run analysis with cancellation checks
		let cancelRequested = false;
		
		try {
			const result = await analyzeRepository(repoUrl, GOOGLE_GENAI_API_KEY, async (progress: number) => {
				// Check if cancelled during analysis
				if (await isCancelled()) {
					if (!cancelRequested) {
						console.log('Scan cancelled at progress:', progress);
						cancelRequested = true;
					}
					return;
				}
				
				await scanRef.update({
					progress,
					updatedAt: now()
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

			// Save repository data (overwrite if exists)
			// If updating existing repo, increment totalScans
			const existingRepoDoc = await repoRef.get();
			const totalScans = existingRepoDoc.exists 
				? ((existingRepoDoc.data() as Repository).totalScans || 1) + 1 
				: 1;
			
			await repoRef.set({
				...result,
				totalScans,
				lastScannedAt: now(),
				updatedAt: now()
			});

			// Mark scan as succeeded and update repoFullName
			await scanRef.update({
				repoFullName: result.metadata.fullName,
				status: ScanStatus.SUCCEEDED,
				progress: 100,
				finishedAt: now(),
				updatedAt: now()
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
			// Determine error code based on error type
			let errorCode: typeof ScanErrorCode[keyof typeof ScanErrorCode] = ScanErrorCode.UNKNOWN;
			
			if (err instanceof Error) {
				const errorMsg = err.message.toLowerCase();
				if (errorMsg.includes('clone')) {
					errorCode = ScanErrorCode.CLONE_FAILED;
				} else if (errorMsg.includes('analys')) {
					errorCode = ScanErrorCode.ANALYSIS_FAILED;
				}
			}
			
			await scanRef.update({
				status: ScanStatus.FAILED,
				errorCode,
				finishedAt: now(),
				updatedAt: now()
			});
		} else {
			console.log('Error occurred during cancelled scan, keeping CANCELLED status');
		}
	}
}
