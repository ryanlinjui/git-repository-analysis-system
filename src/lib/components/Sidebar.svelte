<script lang="ts">
	import { House, History, Search, PanelLeftClose } from 'lucide-svelte';

	interface HistoryItem {
		id: number;
		name: string;
		date: string;
	}

	interface Props {
		open?: boolean;
		items?: HistoryItem[];
		onItemClick?: (item: HistoryItem) => void;
		onToggle?: () => void;
	}

	let { open = $bindable(true), items = [], onItemClick, onToggle }: Props = $props();
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
				<span>History</span>
			</div>
			<div class="space-y-1">
				{#each items as item (item.id)}
					<button
						onclick={() => onItemClick?.(item)}
						class="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
					>
						<Search class="w-4 h-4 shrink-0" />
						<div class="flex-1 text-left truncate">
							<div class="font-medium truncate">{item.name}</div>
							<div class="text-xs text-gray-500 dark:text-gray-400">{item.date}</div>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
</aside>


