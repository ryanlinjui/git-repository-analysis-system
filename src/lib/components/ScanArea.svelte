<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search, AlertCircle, Loader2 } from 'lucide-svelte';
	import { user, quota } from '$lib/stores/auth';
	import { submitScanRequest } from '$lib/scan-client';

	let repoUrl = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state('');

	// Restore last scan ID for anonymous users
	let lastScanId = $state<string | null>(null);
	
	$effect(() => {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('lastScanId');
			if (stored) {
				lastScanId = stored;
			}
		}
	});

	function goToLastScan() {
		const scanId = localStorage.getItem('lastScanId');
		
		if (scanId) {
			goto(`/scan/${scanId}`);
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		
		if (!repoUrl.trim()) {
			errorMessage = 'Please enter a repository URL';
			return;
		}

		// Check quota before submitting
		if (!$quota.hasQuota) {
			errorMessage = 'Daily quota exceeded. Please try again tomorrow or sign in for more scans.';
			return;
		}

		isSubmitting = true;
		errorMessage = '';

		try {
			// Call utils/scan.ts instead of API directly
			const result = await submitScanRequest(repoUrl.trim());

			if (!result.success) {
				throw new Error(result.error || 'Failed to start analysis');
			}

			// Store scan ID for anonymous users
			if (!$user && typeof window !== 'undefined') {
				localStorage.setItem('lastScanId', result.scanId);
			}

			// Navigate to scan page
			goto(`/scan/${result.scanId}`);

		} catch (error) {
			console.error('Scan submission error:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to start analysis';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<!-- Repository Input Section -->
<form
	onsubmit={handleSubmit}
	class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
>
	<div class="mb-6">
		<label for="repo-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
			Repository URL
		</label>
		<div class="relative">
			<input
				id="repo-url"
				type="text"
				bind:value={repoUrl}
				placeholder="https://github.com/username/repository"
				class="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
				disabled={isSubmitting}
				required
			/>
			{#if isSubmitting}
				<Loader2 class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 animate-spin" />
			{:else}
				<Search class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
			{/if}
		</div>
		
		<!-- Error Message -->
		{#if errorMessage}
			<div class="mt-3 flex items-start gap-2 text-red-600 dark:text-red-400 text-sm">
				<AlertCircle class="w-4 h-4 mt-0.5 shrink-0" />
				<span>{errorMessage}</span>
			</div>
		{/if}
	</div>

	<!-- Analyze Button -->
	<button
		type="submit"
		disabled={!repoUrl.trim() || isSubmitting}
		class="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
	>
		{#if isSubmitting}
			<Loader2 class="w-5 h-5 animate-spin" />
			<span>Starting Analysis...</span>
		{:else}
			<span>Start Analysis</span>
		{/if}
	</button>

	<!-- Anonymous User: Return to Last Scan -->
	{#if !$user && lastScanId}
		<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
			<button
				type="button"
				onclick={goToLastScan}
				class="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors text-sm"
			>
				↩ Return to your last analysis
			</button>
		</div>
	{/if}
</form>
