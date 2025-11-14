<script lang="ts">
	import { House, History, PanelLeftClose, Trash2 } from 'lucide-svelte';
	import { scanHistory, formatDate, getTimestamp } from '$lib/stores/history';
	import { getStatusInfo } from './ScanStatus.svelte';
	import { ScanStatus } from '$lib/schema/scan';
	import { goto, invalidate } from '$app/navigation';
	import type { Scan } from '$lib/schema/scan';
	import { deleteScan } from '$lib/scan-client';

	interface Props {
		open?: boolean;
	}

	let { open = $bindable(true) }: Props = $props();

	async function handleScanItemClick(scan: Scan) {
		// If already on a scan page, invalidate to force refresh
		await goto(`/scan/${scan.scanId}`);
		await invalidate('app:scan');
	}

	function toggleSidebar() {
		open = !open;
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

<aside
	class="bg-white dark:bg-gray-900 shrink-0 transition-all duration-300 ease-in-out overflow-hidden flex flex-col {open
		? 'w-64 opacity-100 border-r border-gray-200 dark:border-gray-800'
		: 'w-0 opacity-0 border-r-0'}"
>
	<div class="flex items-center justify-between px-4 h-[57px] border-b border-gray-200 dark:border-gray-800 w-64 shrink-0">
		<a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
			<House class="w-6 h-6 text-blue-600" />
			<span class="font-semibold text-lg text-gray-900 dark:text-white whitespace-nowrap"
				>GitRepoScanner</span
			>
		</a>
		<button
			onclick={toggleSidebar}
			class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
			aria-label="Close sidebar"
		>
			<PanelLeftClose class="w-5 h-5 text-gray-600 dark:text-gray-300" />
		</button>
	</div>

	<!-- Sidebar Content -->
	<div class="flex-1 overflow-hidden w-64">
		<div class="h-full overflow-y-auto px-3 py-4">
			<div
				class="flex items-center gap-2 mb-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase"
			>
				<History class="w-4 h-4" />
				<span>Scan History</span>
			</div>
			
			{#if $scanHistory.length === 0}
				<div class="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
					No scan records found
				</div>
			{:else}
				<!-- Active Scans (Running/Queued) - sorted by updatedAt -->
				{@const activeScans = $scanHistory
					.filter((s: Scan) => s.status === ScanStatus.RUNNING || s.status === ScanStatus.QUEUED)
					.sort((a: Scan, b: Scan) => {
						// Sort by status first (running before queued)
						if (a.status !== b.status) {
							return a.status === ScanStatus.RUNNING ? -1 : 1;
						}
						// Then by updatedAt descending
						return getTimestamp(b.updatedAt) - getTimestamp(a.updatedAt);
					})}
				{#if activeScans.length > 0}
					<div class="mb-4">
						<div class="px-2 mb-2 text-xs font-medium text-blue-600 dark:text-blue-400">
							Active ({activeScans.length})
						</div>
						<div class="space-y-1">
							{#each activeScans as scan (scan.scanId)}
								{@const statusInfo = getStatusInfo(scan.status)}
								{@const StatusIcon = statusInfo.icon}
								<div
									class="w-full flex items-start gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors group cursor-pointer"
									role="button"
									tabindex="0"
									onclick={() => handleScanItemClick(scan)}
									onkeydown={(e) => e.key === 'Enter' && handleScanItemClick(scan)}
								>
									<StatusIcon class="w-4 h-4 shrink-0 mt-0.5 {statusInfo.color}" />
									<div class="flex-1 text-left min-w-0">
										<div class="font-medium truncate">{scan.repoFullName}</div>
										<div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
											<span class="{statusInfo.color}">{statusInfo.label}</span>
											{#if scan.status === ScanStatus.RUNNING && scan.progress > 0}
												<span>• {scan.progress}%</span>
											{/if}
											<span>• {formatDate(scan.createdAt)}</span>
										</div>
									</div>
									<button
										onclick={(e) => handleDeleteScan(e, scan.scanId)}
										class="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
										aria-label="Delete scan"
									>
										<Trash2 class="w-4 h-4 text-red-600 dark:text-red-400" />
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Completed Scans - sorted by finishedAt/updatedAt -->
				{@const completedScans = $scanHistory
					.filter((s: Scan) => s.status === ScanStatus.SUCCEEDED || s.status === ScanStatus.FAILED)
					.sort((a: Scan, b: Scan) => {
						const aTime = getTimestamp(a.finishedAt) || getTimestamp(a.updatedAt);
						const bTime = getTimestamp(b.finishedAt) || getTimestamp(b.updatedAt);
						return bTime - aTime;
					})}
				{#if completedScans.length > 0}
					<div>
						<div class="px-2 mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
							Recent ({completedScans.length})
						</div>
						<div class="space-y-1">
							{#each completedScans as scan (scan.scanId)}
								{@const statusInfo = getStatusInfo(scan.status)}
								{@const StatusIcon = statusInfo.icon}
								<div
									class="w-full flex items-start gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors group cursor-pointer"
									role="button"
									tabindex="0"
									onclick={() => handleScanItemClick(scan)}
									onkeydown={(e) => e.key === 'Enter' && handleScanItemClick(scan)}
								>
									<StatusIcon class="w-4 h-4 shrink-0 mt-0.5 {statusInfo.color}" />
									<div class="flex-1 text-left min-w-0">
										<div class="font-medium truncate">{scan.repoFullName}</div>
										<div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
											<span class="{statusInfo.color}">{statusInfo.label}</span>
											<span>• {formatDate(scan.finishedAt || scan.updatedAt)}</span>
										</div>
									</div>
									<button
										onclick={(e) => handleDeleteScan(e, scan.scanId)}
										class="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
										aria-label="Delete scan"
									>
										<Trash2 class="w-4 h-4 text-red-600 dark:text-red-400" />
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</aside>
