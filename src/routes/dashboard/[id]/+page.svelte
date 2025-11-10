<script lang="ts">
	import { User } from 'lucide-svelte';

	// Mock user data - will fetch from server later
	let user = $state({
		id: 'ryanlinjui',
		name: 'Ryan Lin',
		avatar: null // null means using default avatar
	});
</script>

<div class="max-w-4xl mx-auto px-4 py-12">
	<!-- Dashboard Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
		<p class="text-gray-600 dark:text-gray-400">Manage your analysis records and profile</p>
	</div>

	<!-- User Profile Card -->
	<div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
		<div class="flex items-center gap-6">
			<!-- Avatar -->
			<div class="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shrink-0">
				{#if user.avatar}
					<img src={user.avatar} alt={user.name} class="w-full h-full rounded-full object-cover" />
				{:else}
					<User class="w-12 h-12" />
				{/if}
			</div>

			<!-- User Info -->
			<div class="flex-1">
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{user.name}</h2>
				<p class="text-gray-600 dark:text-gray-400 flex items-center gap-2">
					<span class="text-sm font-mono">@{user.id}</span>
				</p>
			</div>
		</div>
	</div>

	<!-- Stats Cards (optional, will expand later) -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
		<div class="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6">
			<div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Analyses</div>
			<div class="text-3xl font-bold text-gray-900 dark:text-white">3</div>
		</div>
		
		<div class="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6">
			<div class="text-sm text-gray-600 dark:text-gray-400 mb-1">This Month</div>
			<div class="text-3xl font-bold text-gray-900 dark:text-white">3</div>
		</div>
		
		<div class="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6">
			<div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Days Active</div>
			<div class="text-3xl font-bold text-gray-900 dark:text-white">7</div>
		</div>
	</div>
</div>
