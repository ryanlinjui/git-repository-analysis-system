<script lang="ts">
	import '../app.css';
	import { House, Menu } from 'lucide-svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	interface HistoryItem {
		id: number;
		name: string;
		date: string;
	}

	let { children } = $props();

	// State management
	let sidebarOpen = $state(true);
	let historyItems = $state<HistoryItem[]>([
		{ id: 1, name: 'facebook/react', date: '2024-11-08' },
		{ id: 2, name: 'microsoft/vscode', date: '2024-11-07' },
		{ id: 3, name: 'vercel/next.js', date: '2024-11-06' }
	]);

	// Handlers
	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function handleHistoryClick(item: HistoryItem) {
		console.log('History item clicked:', item);
		// TODO: Navigate to repository page
	}
</script>

<div class="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
	<!-- Sidebar Component -->
	<Sidebar bind:open={sidebarOpen} items={historyItems} onItemClick={handleHistoryClick} onToggle={toggleSidebar} />

	<!-- Main Content Area -->
	<div class="flex-1 flex flex-col min-w-0">
		<!-- Header -->
		<header
			class="h-[57px] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0"
		>
			<div class="flex items-center gap-4">
				<!-- Toggle Button (visible when sidebar is closed) -->
				{#if !sidebarOpen}
					<button
						onclick={toggleSidebar}
						class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
						aria-label="Open sidebar"
					>
						<Menu class="w-5 h-5 text-gray-700 dark:text-gray-300" />
					</button>
					
					<!-- Logo and Title (only visible when sidebar is closed) -->
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
