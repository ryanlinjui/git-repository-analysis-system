<script lang="ts">
	import { House, History, Search, PanelLeftClose, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-svelte';
	import type { Scan } from '$lib/schema/scan';
	import type { Timestamp } from '$lib/schema/utils';

	interface Props {
		open?: boolean;
		scanHistory?: Scan[];
		onScanItemClick?: (scan: Scan) => void;
		onToggle?: () => void;
	}

	let { open = $bindable(true), scanHistory = [], onScanItemClick, onToggle }: Props = $props();

	// Helper function to get status icon and color
	function getStatusInfo(status: Scan['status']) {
		switch (status) {
			case 'succeeded':
				return { icon: CheckCircle2, color: 'text-green-500' };
			case 'failed':
				return { icon: XCircle, color: 'text-red-500' };
			case 'running':
				return { icon: Loader2, color: 'text-blue-500 animate-spin' };
			case 'queued':
				return { icon: Clock, color: 'text-gray-400' };
			default:
				return { icon: Search, color: 'text-gray-400' };
		}
	}

	// Format date to relative time or absolute
	function formatDate(timestamp: Timestamp): string {
		let date: Date;
		
		// Convert Firestore Timestamp to Date if needed
		if (timestamp instanceof Date) {
			date = timestamp;
		} else if (typeof timestamp === 'object' && 'seconds' in timestamp) {
			// Firestore Timestamp format
			date = new Date(timestamp.seconds * 1000);
		} else {
			// Fallback
			date = new Date(timestamp as any);
		}
		
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins} mins ago`;
		if (diffHours < 24) return `${diffHours} hours ago`;
		if (diffDays < 7) return `${diffDays} days ago`;
		return date.toLocaleDateString('en-US');
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
			onclick={onToggle}
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
			<div class="space-y-1">
				{#if scanHistory.length === 0}
					<div class="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
						No scan records found
					</div>
				{:else}
					{#each scanHistory as scan (scan.scanId)}
						{@const statusInfo = getStatusInfo(scan.status)}
						{@const StatusIcon = statusInfo.icon}
						<button
							onclick={() => onScanItemClick?.(scan)}
							class="w-full flex items-start gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
						>
							<StatusIcon class="w-4 h-4 shrink-0 mt-0.5 {statusInfo.color}" />
							<div class="flex-1 text-left min-w-0">
								<div class="font-medium truncate">{scan.repoId}</div>
								<div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
									<span>{formatDate(scan.createdAt)}</span>
									{#if scan.status === 'running' && scan.progress > 0}
										<span>• {scan.progress}%</span>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</aside>
