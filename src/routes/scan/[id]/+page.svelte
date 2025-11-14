<script lang="ts">
	import { goto } from '$app/navigation';
	import { db } from '$lib/firebase';
	import { doc, onSnapshot } from 'firebase/firestore';
	import type { PageData } from './$types';
	import type { Repository } from '$lib/schema/repository';
	import { ScanStatus } from '$lib/schema/scan';
	import RepoSummary from '$lib/components/RepoSummary.svelte';
	import ScanProgress from '$lib/components/ScanProgress.svelte';
	import { activeScan, loading, error, watchScan, unwatchScan } from '$lib/stores/scan-status';

	let { data }: { data: PageData } = $props();

	// Repository state
	let repository = $state<Repository | null>(null);
	let repoUnsubscribe: (() => void) | null = null;

	// Derived
	const showRepository = $derived($activeScan?.status === ScanStatus.SUCCEEDED && repository !== null);

	// Helper: Convert Firestore Timestamp to Date
	function toDate(timestamp: any): Date | null {
		return timestamp?.toDate?.() ?? timestamp ?? null;
	}

	// Watch scanId and repository
	$effect(() => {
		const scanId = data.scanId;
		
		// Reset repository when scanId changes
		repository = null;
		
		// Start watching scan
		watchScan(scanId);

		// Cleanup on unmount or scanId change
		return () => {
			unwatchScan();
			if (repoUnsubscribe) {
				repoUnsubscribe();
				repoUnsubscribe = null;
			}
		};
	});

	// Watch for scan success to load repository
	$effect(() => {
		if ($activeScan?.status === ScanStatus.SUCCEEDED && $activeScan.repoId && !repository) {
			// Clean up previous repo listener
			if (repoUnsubscribe) {
				repoUnsubscribe();
				repoUnsubscribe = null;
			}

			// Listen to repository
			repoUnsubscribe = onSnapshot(
				doc(db, 'repository', $activeScan.repoId),
				(repoSnapshot) => {
					if (repoSnapshot.exists()) {
						const repoData = repoSnapshot.data();
						repository = {
							repoId: repoSnapshot.id,
							...repoData,
							lastScannedAt: toDate(repoData.lastScannedAt),
							createdAt: toDate(repoData.createdAt),
							updatedAt: toDate(repoData.updatedAt),
							metadata: {
								...repoData.metadata,
								lastUpdated: toDate(repoData.metadata?.lastUpdated)
							}
						} as Repository;
					}
				}
			);
		}
	});
</script>

<svelte:head>
	{#if showRepository && repository}
		<title>{repository.metadata.fullName} - Analysis Results</title>
		<meta name="description" content="Analysis results for {repository.metadata.fullName}" />
	{:else}
		<title>Scanning Repository...</title>
		<meta name="description" content="Repository analysis in progress" />
	{/if}
</svelte:head>

<div class="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
	<div class="max-w-6xl mx-auto px-4 py-8">
		{#if $loading}
			<div class="flex items-center justify-center min-h-[60vh]">
				<div class="text-center">
					<div class="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p class="text-gray-600 dark:text-gray-400">Loading scan data...</p>
				</div>
			</div>
		{:else if $error}
			<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
				<h2 class="text-xl font-bold text-red-800 dark:text-red-300 mb-2">Error</h2>
				<p class="text-red-600 dark:text-red-400">{$error}</p>
				<button
					onclick={() => goto('/')}
					class="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
				>
					Go Home
				</button>
			</div>
		{:else if showRepository && repository}
			<RepoSummary {repository} scanId={data.scanId} />
		{:else if $activeScan}
			<ScanProgress scan={$activeScan} />
		{/if}
	</div>
</div>
