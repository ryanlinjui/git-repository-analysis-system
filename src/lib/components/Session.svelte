<script lang="ts">
	import { Search } from 'lucide-svelte';

	interface Props {
		repoUrl?: string;
		onAnalyze?: (url: string) => void;
	}

	let { repoUrl = $bindable(''), onAnalyze }: Props = $props();

	function handleAnalyze() {
		if (repoUrl.trim()) {
			onAnalyze?.(repoUrl);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleAnalyze();
		}
	}
</script>

<div
	class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
>
	<div class="mb-6">
		<label for="repo-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
			Repository URL
		</label>
		<div class="relative">
			<input
				id="repo-url"
				type="text"
				bind:value={repoUrl}
				placeholder="https://github.com/username/repository"
				class="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
				onkeydown={handleKeydown}
			/>
			<Search class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
		</div>
	</div>

	<button
		onclick={handleAnalyze}
		disabled={!repoUrl.trim()}
		class="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
	>
		Start Analysis
	</button>
</div>
