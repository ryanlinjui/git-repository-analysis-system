<script lang="ts">
	import { goto } from '$app/navigation';
	import { User as UserIcon, ArrowUpDown, Trash2 } from 'lucide-svelte';
	import { user } from '$lib/stores/auth';
	import { formatRelativeTime, getTimestamp } from '$lib/utils/date';
	import { scanHistory } from '$lib/stores/history';
	import { getStatusInfo } from '$lib/components/ScanStatus.svelte';
	import { ScanStatus } from '$lib/schema/scan';
	import type { Scan, ScanStatusValue } from '$lib/schema/scan';
	import { deleteScan } from '$lib/scan-client';

	// Filter and sort states
	let statusFilter = $state<ScanStatusValue | 'all'>('all');
	let sortOrder = $state<'asc' | 'desc'>('desc');

	// Filtered and sorted scans
	const filteredScans = $derived.by(() => {
		let scans = $scanHistory;
		
		// Filter by status
		if (statusFilter !== 'all') {
			scans = scans.filter(s => s.status === statusFilter);
		}
		
		// Sort by time
		scans = [...scans].sort((a, b) => {
			const aTime = getTimestamp(a.finishedAt || a.updatedAt || a.createdAt);
			const bTime = getTimestamp(b.finishedAt || b.updatedAt || b.createdAt);
			return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
		});
		
		return scans;
	});

	function handleScanClick(scan: Scan) {
		goto(`/scan/${scan.scanId}`);
	}

	function toggleSort() {
		sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
	}

	async function handleDeleteScan(event: MouseEvent, scanId: string) {
		event.stopPropagation(); // Prevent navigation to scan page

		if (!confirm('Are you sure you want to delete this scan?')) {
			return;
		}

		const result = await deleteScan(scanId);
		
		if (!result.success) {
			alert(result.error || 'Failed to delete scan');
		}
		// scanHistory store will automatically update via Firestore listener
	}
</script>

<div class="max-w-4xl mx-auto px-4 py-12">
	<!-- Dashboard Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
		<p class="text-gray-600 dark:text-gray-400">Manage your analysis records and profile</p>
	</div>

	<!-- User Profile Card -->
	{#if $user}
		<div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
			<div class="flex items-center gap-6">
				<!-- Avatar -->
				<div class="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shrink-0 overflow-hidden">
					{#if $user.photoURL}
						<img src={$user.photoURL} alt={$user.displayName} class="w-full h-full object-cover" />
					{:else}
						<UserIcon class="w-12 h-12" />
					{/if}
				</div>

				<!-- User Info -->
				<div class="flex-1">
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{$user.displayName}</h2>
					<p class="text-gray-600 dark:text-gray-400 flex items-center gap-2">
						<span class="text-sm font-mono">{$user.email}</span>
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Stats Cards (optional, will expand later) -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
		<div class="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6">
			<div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Analyses</div>
			<div class="text-3xl font-bold text-gray-900 dark:text-white">{$scanHistory.length}</div>
		</div>
		
		<div class="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6">
			<div class="text-sm text-gray-600 dark:text-gray-400 mb-1">This Month</div>
			<div class="text-3xl font-bold text-gray-900 dark:text-white">
				{$scanHistory.filter(s => {
					const createdAt = getTimestamp(s.createdAt);
					const now = Date.now();
					const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
					return createdAt >= monthAgo;
				}).length}
			</div>
		</div>
		
		<div class="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6">
			<div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Success Rate</div>
			<div class="text-3xl font-bold text-gray-900 dark:text-white">
				{#if $scanHistory.length > 0}
					{Math.round(($scanHistory.filter(s => s.status === ScanStatus.SUCCEEDED).length / $scanHistory.length) * 100)}%
				{:else}
					0%
				{/if}
			</div>
		</div>
	</div>

	<!-- Scan History Section -->
	<div class="mt-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
		<!-- Header with filters -->
		<div class="p-6 border-b border-gray-200 dark:border-gray-800">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-bold text-gray-900 dark:text-white">Scan History</h2>
				<button
					onclick={toggleSort}
					class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					<ArrowUpDown class="w-4 h-4" />
					{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
				</button>
			</div>
			
			<!-- Filters -->
			<div class="flex items-center gap-3 flex-wrap">
				<button
					onclick={() => statusFilter = 'all'}
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {statusFilter === 'all' 
						? 'bg-blue-500 text-white' 
						: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}"
				>
					All ({$scanHistory.length})
				</button>
				<button
					onclick={() => statusFilter = ScanStatus.RUNNING}
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {statusFilter === ScanStatus.RUNNING 
						? 'bg-blue-500 text-white' 
						: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}"
				>
					Running ({$scanHistory.filter(s => s.status === ScanStatus.RUNNING).length})
				</button>
				<button
					onclick={() => statusFilter = ScanStatus.QUEUED}
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {statusFilter === ScanStatus.QUEUED 
						? 'bg-blue-500 text-white' 
						: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}"
				>
					Queued ({$scanHistory.filter(s => s.status === ScanStatus.QUEUED).length})
				</button>
				<button
					onclick={() => statusFilter = ScanStatus.SUCCEEDED}
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {statusFilter === ScanStatus.SUCCEEDED 
						? 'bg-blue-500 text-white' 
						: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}"
				>
					Completed ({$scanHistory.filter(s => s.status === ScanStatus.SUCCEEDED).length})
				</button>
				<button
					onclick={() => statusFilter = ScanStatus.FAILED}
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {statusFilter === ScanStatus.FAILED 
						? 'bg-blue-500 text-white' 
						: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}"
				>
					Failed ({$scanHistory.filter(s => s.status === ScanStatus.FAILED).length})
				</button>
			</div>
		</div>

		<!-- Scan List -->
		<div class="divide-y divide-gray-200 dark:divide-gray-800">
			{#if filteredScans.length === 0}
				<div class="p-12 text-center text-gray-500 dark:text-gray-400">
					<p class="text-lg mb-2">No scans found</p>
					<p class="text-sm">Try adjusting your filters or create a new scan</p>
				</div>
			{:else}
				{#each filteredScans as scan (scan.scanId)}
					{@const statusInfo = getStatusInfo(scan.status)}
					{@const StatusIcon = statusInfo.icon}
					<div
						class="w-full p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-4 group cursor-pointer"
						role="button"
						tabindex="0"
						onclick={() => handleScanClick(scan)}
						onkeydown={(e) => e.key === 'Enter' && handleScanClick(scan)}
					>
						<!-- Status Icon -->
						<div class="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center {statusInfo.color}">
							<StatusIcon class="w-6 h-6" />
						</div>

						<!-- Scan Info -->
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-gray-900 dark:text-white mb-1 truncate">{scan.repoFullName}</h3>
							<div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
								<span class="inline-flex items-center gap-1.5">
									<span class="{statusInfo.color} font-medium">{statusInfo.label}</span>
								</span>
								{#if scan.status === ScanStatus.RUNNING && scan.progress > 0}
									<span>•</span>
									<span class="text-blue-600 dark:text-blue-400 font-medium">{scan.progress}%</span>
								{/if}
								<span>•</span>
								<span>{formatRelativeTime(scan.finishedAt || scan.updatedAt || scan.createdAt)}</span>
								{#if scan.finishedAt && scan.startedAt}
									{@const duration = Math.round((getTimestamp(scan.finishedAt) - getTimestamp(scan.startedAt)) / 1000)}
									<span>•</span>
									<span>{duration}s</span>
								{/if}
							</div>
						</div>

						<!-- Delete Button -->
						<button
							onclick={(e) => handleDeleteScan(e, scan.scanId)}
							class="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
							aria-label="Delete scan"
						>
							<Trash2 class="w-5 h-5 text-red-600 dark:text-red-400" />
						</button>

						<!-- Arrow -->
						<div class="shrink-0 text-gray-400">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
