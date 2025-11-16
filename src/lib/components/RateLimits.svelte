<script lang="ts">
	import { Zap, Clock } from 'lucide-svelte';
	import { quota, isLoggedIn } from '$lib/stores/auth';
	import { anonymousQuota } from '$lib/stores/anonymous';
	import { formatTimeUntilReset, toDate } from '$lib/utils/date';
	import { ANONYMOUS_USER_QUOTA_LIMIT, UNLIMITED_QUOTA_FLAG } from '$lib/schema/user';

	// Countdown timer state
	let timeUntilResetDisplay = $state('');

	// Unified quota: use auth quota if logged in, otherwise anonymous quota
	const displayQuota = $derived($isLoggedIn ? $quota : $anonymousQuota);

	// Derived quota values with defaults
	const isUnlimited = $derived(displayQuota?.limit === UNLIMITED_QUOTA_FLAG || ($isLoggedIn && !displayQuota));
	const remaining = $derived.by(() => {
		if (displayQuota) {
			return Math.max(0, displayQuota.limit - displayQuota.used);
		}
		// Default: show full quota before data loads
		return $isLoggedIn ? 0 : ANONYMOUS_USER_QUOTA_LIMIT;
	});
	const limit = $derived.by(() => {
		if (displayQuota) {
			return displayQuota.limit;
		}
		// Default: show full quota before data loads
		return $isLoggedIn ? 0 : ANONYMOUS_USER_QUOTA_LIMIT;
	});

	// Update countdown timer every second
	$effect(() => {
		if (!displayQuota?.resetAt) {
			timeUntilResetDisplay = '';
			return;
		}

		const updateTimer = () => {
			timeUntilResetDisplay = formatTimeUntilReset(toDate(displayQuota.resetAt));
		};

		updateTimer();

		// Start interval to update every second
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	});

	// Progress percentage
	const progressPercentage = $derived(
		isUnlimited ? 100 : limit > 0 ? (remaining / limit) * 100 : 100
	);
</script>

<div class="mb-6 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
				<Zap class="w-5 h-5 text-white" />
			</div>
			<div>
				<div class="text-sm font-medium text-gray-600 dark:text-gray-400">Scan Quota</div>
				<div class="text-lg font-bold text-gray-900 dark:text-white">
					{#if isUnlimited}
						Unlimited ∞
					{:else}
						{remaining} / {limit} remaining
					{/if}
				</div>
			</div>
		</div>
		{#if !isUnlimited && timeUntilResetDisplay}
			<div class="text-right">
				<div class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
					<Clock class="w-3 h-3" />
					Resets in
				</div>
				<div class="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
					{timeUntilResetDisplay}
				</div>
			</div>
		{/if}
	</div>
	
	<!-- Progress bar -->
	{#if !isUnlimited}
		<div class="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
			<div 
				class="h-full bg-linear-to-r from-blue-500 to-indigo-600 transition-all duration-300"
				style="width: {progressPercentage}%"
			></div>
		</div>
	{/if}

	<!-- Anonymous user notice -->
	{#if !$isLoggedIn}
		<div class="mt-3 text-sm text-gray-500 dark:text-gray-400">
			💡 Sign in for more scans
		</div>
	{/if}
</div>
