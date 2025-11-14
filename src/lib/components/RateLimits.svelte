<script lang="ts">
	import { Zap, Clock, AlertCircle } from 'lucide-svelte';
	import { user, quota } from '$lib/stores/auth';

	// Countdown timer state
	let timeUntilReset = $state('');

	// Update countdown timer every second
	$effect(() => {
		if (!$quota.resetAt) {
			timeUntilReset = '';
			return;
		}

		const updateTimer = () => {
			const now = new Date();
			const reset = $quota.resetAt!;
			
			const diff = reset.getTime() - now.getTime();

			if (diff <= 0) {
				timeUntilReset = 'Resetting...';
				return;
			}

			const hours = Math.floor(diff / (1000 * 60 * 60));
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((diff % (1000 * 60)) / 1000);

			timeUntilReset = `${hours}h ${minutes}m ${seconds}s`;
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	});

	// Progress percentage for authenticated users
	const progressPercentage = $derived(
		$quota.isUnlimited ? 100 : ($quota.remaining / $quota.limit) * 100
	);
</script>

{#if $user}
	<!-- Authenticated User Quota -->
	<div class="mb-6 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
					<Zap class="w-5 h-5 text-white" />
				</div>
				<div>
					<div class="text-sm font-medium text-gray-600 dark:text-gray-400">Scan Quota</div>
					<div class="text-lg font-bold text-gray-900 dark:text-white">
						{#if $quota.isUnlimited}
							Unlimited ∞
						{:else}
							{$quota.remaining} / {$quota.limit} remaining
						{/if}
					</div>
				</div>
			</div>
			{#if !$quota.isUnlimited && timeUntilReset}
				<div class="text-right">
					<div class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
						<Clock class="w-3 h-3" />
						Resets in
					</div>
					<div class="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
						{timeUntilReset}
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Progress bar -->
		{#if !$quota.isUnlimited}
			<div class="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
				<div 
					class="h-full bg-linear-to-r from-blue-500 to-indigo-600 transition-all duration-300"
					style="width: {progressPercentage}%"
				></div>
			</div>
		{/if}
	</div>
{:else}
	<!-- Anonymous User Notice -->
	<div class="mb-6 bg-linear-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
		<div class="flex items-start gap-3">
			<div class="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center shrink-0">
				<AlertCircle class="w-5 h-5 text-white" />
			</div>
			<div class="flex-1">
				<div class="text-sm font-medium text-gray-900 dark:text-white mb-1">
					You have <strong>{$quota.remaining} scan{$quota.remaining !== 1 ? 's' : ''}</strong> remaining today. 
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					Sign in for unlimited scans.
				</div>
				{#if timeUntilReset}
					<div class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
						<Clock class="w-3 h-3" />
						Quota resets in: <span class="font-mono font-semibold text-yellow-600 dark:text-yellow-400">{timeUntilReset}</span>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
