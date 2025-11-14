<script lang="ts">
	import '../app.css';
	import { House, Menu } from 'lucide-svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { isLoggedIn } from '$lib/stores/auth';

	let { children } = $props();

	let sidebarOpen = $state(true);

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}
</script>

<div class="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
	<!-- Sidebar Component - Only show if logged in -->
	{#if $isLoggedIn}
		<Sidebar bind:open={sidebarOpen} />
	{/if}

	<!-- Top Content Area -->
	<div class="flex-1 flex flex-col min-w-0">
		<header
			class="h-[57px] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0"
		>
			<div class="flex items-center gap-4">
				<!-- Toggle Button (visible when sidebar is closed and user is logged in) -->
				{#if $isLoggedIn && !sidebarOpen}
					<button
						onclick={toggleSidebar}
						class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
						aria-label="Open sidebar"
					>
						<Menu class="w-5 h-5 text-gray-700 dark:text-gray-300" />
					</button>
				{/if}
					
				<!-- Logo and Title (visible when sidebar is closed OR user is not logged in) -->
				{#if !sidebarOpen || !$isLoggedIn}
					<a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
						<House class="w-6 h-6 text-blue-600" />
						<span class="font-semibold text-lg text-gray-900 dark:text-white whitespace-nowrap"
							>GitRepoScanner</span
						>
					</a>
				{/if}
			</div>

			<!-- Right: Avatar Component -->
			<Avatar />
		</header>

		<!-- Page Content -->
		<main class="flex-1 overflow-y-auto">
			{@render children()}
		</main>
	</div>
</div>
