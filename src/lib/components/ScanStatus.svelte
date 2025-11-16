<script lang="ts" module>
	import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-svelte';
	import type { ComponentType } from 'svelte';
	import { ScanStatus } from '$lib/schema/scan';
	import type { ScanStatusValue } from '$lib/schema/scan';

	/**
	 * Status display configuration
	 */
	export const SCAN_STATUS_CONFIG: Record<
		ScanStatusValue,
		{
			name: 'queued' | 'running' | 'succeeded' | 'failed';
			icon: ComponentType;
			color: string;
			label: string;
		}
	> = {
		[ScanStatus.QUEUED]: {
			name: 'queued',
			icon: Clock,
			color: 'text-yellow-500',
			label: 'Queued'
		},
		[ScanStatus.RUNNING]: {
			name: 'running',
			icon: Loader2,
			color: 'text-blue-500 animate-spin',
			label: 'Running'
		},
		[ScanStatus.SUCCEEDED]: {
			name: 'succeeded',
			icon: CheckCircle2,
			color: 'text-green-500',
			label: 'Completed'
		},
		[ScanStatus.FAILED]: {
			name: 'failed',
			icon: XCircle,
			color: 'text-red-500',
			label: 'Failed'
		}
	};

	/**
	 * Get status info
	 */
	export function getStatusInfo(status: ScanStatusValue) {
		return SCAN_STATUS_CONFIG[status] || SCAN_STATUS_CONFIG[ScanStatus.QUEUED];
	}
</script>

<script lang="ts">
	interface Props {
		status: ScanStatusValue;
		showLabel?: boolean;
		class?: string;
	}

	let { status, showLabel = true, class: className = '' }: Props = $props();

	const statusInfo = $derived(getStatusInfo(status));
	const StatusIcon = $derived(statusInfo.icon);
</script>

<div class="flex items-center gap-2 {className}">
	<StatusIcon class="w-4 h-4 {statusInfo.color}" />
	{#if showLabel}
		<span class="{statusInfo.color}">{statusInfo.label}</span>
	{/if}
</div>
