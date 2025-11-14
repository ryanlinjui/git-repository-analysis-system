<script lang="ts">
	import { goto } from '$app/navigation';
	import { cancelScan } from '$lib/scan-client';
	import { Loader2, CheckCircle2, XCircle, X, AlertCircle } from 'lucide-svelte';
	import type { Scan } from '$lib/schema/scan';
	import { ScanStatus } from '$lib/schema/scan';

	interface Props {
		scan: Scan;
		onCancel?: () => void;
	}

	let { scan, onCancel }: Props = $props();

	// Derived states
	const isActive = $derived(scan.status === ScanStatus.QUEUED || scan.status === ScanStatus.RUNNING);
	const isCompleted = $derived(scan.status === ScanStatus.SUCCEEDED);
	const isFailed = $derived(scan.status === ScanStatus.FAILED);
	
	// Progress message based on percentage
	const progressMessage = $derived.by(() => {
		if (scan.status === ScanStatus.QUEUED) return '⏳ Waiting in queue...';
		if (scan.status === ScanStatus.RUNNING) {
			const p = scan.progress;
			if (p < 10) return '🔗 Initializing connection...';
			if (p < 25) return '📦 Cloning repository...';
			if (p < 40) return '🔍 Fetching metadata...';
			if (p < 55) return '📊 Collecting files...';
			if (p < 70) return '🤖 AI analyzing comprehensively...';
			if (p < 85) return '🤖 Analyzing tech stack...';
			if (p < 95) return '🤖 Evaluating code quality...';
			return '📋 Compiling results...';
		}
		if (scan.status === ScanStatus.SUCCEEDED) return '✅ Analysis complete!';
		if (scan.status === ScanStatus.FAILED) return `❌ ${scan.errorMessage || 'Analysis failed'}`;
		return 'Processing...';
	});

	async function handleCancel() {
		if (!confirm('Are you sure you want to cancel this scan?')) return;

		const result = await cancelScan(scan.scanId);
		
		if (result.success) {
			onCancel?.();
			// Stay on current page after cancellation
		} else {
			console.error('Error cancelling scan:', result.error);
			alert(result.error || 'Failed to cancel scan. Please try again.');
		}
	}
</script>

<div class="max-w-3xl mx-auto">
	<!-- Main Card -->
	<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
		<!-- Header -->
		<div class="relative bg-linear-to-r from-blue-600 to-indigo-600 p-8 text-white">
			{#if isActive}
				<button
					onclick={handleCancel}
					class="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
					aria-label="Cancel scan"
				>
					<X class="w-5 h-5" />
				</button>
			{/if}

			<div class="flex items-center gap-4">
				{#if isActive}
					<Loader2 class="w-12 h-12 animate-spin" />
				{:else if isCompleted}
					<CheckCircle2 class="w-12 h-12" />
				{:else if isFailed}
					<XCircle class="w-12 h-12 text-red-400" />
				{/if}

				<div>
					<h2 class="text-2xl font-bold">
						{#if isActive}
							Analyzing Repository
						{:else if isCompleted}
							Analysis Complete!
						{:else if isFailed}
							Analysis Failed
						{:else}
							Processing...
						{/if}
					</h2>
					<p class="text-blue-100 text-sm mt-1">
						Scan ID: <code class="font-mono bg-white/20 px-2 py-0.5 rounded">{scan.scanId.slice(0, 12)}...</code>
					</p>
				</div>
			</div>
		</div>

		<!-- Content -->
		<div class="p-8">
			<!-- Progress Bar -->
			{#if isActive || isCompleted}
				<div class="mb-8">
					<div class="flex items-center justify-between mb-3">
						<span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</span>
						<span class="text-sm font-bold text-blue-600 dark:text-blue-400">{scan.progress}%</span>
					</div>
					<div class="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
						<div
							class="absolute inset-0 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
							style="width: {scan.progress}%; box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);"
						></div>
						{#if isActive}
							<div class="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Status Message -->
			<div class="mb-8">
				<div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
					<p class="text-lg font-medium text-gray-800 dark:text-gray-200">
						{progressMessage}
					</p>
				</div>
			</div>

			<!-- Error Details -->
			{#if isFailed && scan.errorMessage}
				<div class="mb-8">
					<div class="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6">
						<div class="flex items-start gap-3">
							<AlertCircle class="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-1" />
							<div class="flex-1">
								<h3 class="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Error Details</h3>
								<p class="text-red-700 dark:text-red-400 mb-1">{scan.errorMessage}</p>
								{#if scan.errorCode}
									<p class="text-sm text-red-600 dark:text-red-500 font-mono">Error Code: {scan.errorCode}</p>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="flex gap-3">
				{#if isActive}
					<button
						onclick={handleCancel}
						class="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
					>
						Cancel Analysis
					</button>
				{:else if isFailed}
					<button
						onclick={() => goto('/')}
						class="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
					>
						Try Another Repository
					</button>
				{/if}

				<button
					onclick={() => goto('/')}
					class="flex-1 py-3 px-6 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-all"
				>
					Go Home
				</button>
			</div>

			<!-- Info Box -->
			{#if isActive}
				<div class="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
					<h3 class="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">What's happening?</h3>
					<ul class="space-y-2 text-sm text-blue-800 dark:text-blue-300">
						<li>• Cloning your repository (shallow clone)</li>
						<li>• Analyzing file structure and dependencies</li>
						<li>• Detecting programming languages and frameworks</li>
						<li>• Generating AI-powered insights with Gemini</li>
					</ul>
					<p class="mt-3 text-xs text-blue-700 dark:text-blue-400 italic">
						This usually takes 30-90 seconds depending on repository size.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}
	.animate-shimmer {
		animation: shimmer 2s infinite;
	}
</style>
