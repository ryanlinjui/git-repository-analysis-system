<script lang="ts">
	import { Search, History, User } from 'lucide-svelte';
</script>

<!-- Welcome Section -->
<div class="text-center mb-8">
	<h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Git Repository Scanner</h1>
	<p class="text-lg text-gray-600 dark:text-gray-400">
		Enter a Git repository URL to instantly analyze code quality, dependencies, and project insights
	</p>
</div>

<!-- Features Section -->
<div class="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
	<div
		class="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
	>
		<div
			class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4"
		>
			<Search class="w-6 h-6 text-blue-600 dark:text-blue-400" />
		</div>
		<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Deep Analysis</h3>
		<p class="text-gray-600 dark:text-gray-400 text-sm">
			Automatically scan code structure, dependencies, and potential issues
		</p>
	</div>

	<div
		class="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
	>
		<div
			class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4"
		>
			<History class="w-6 h-6 text-green-600 dark:text-green-400" />
		</div>
		<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">History Tracking</h3>
		<p class="text-gray-600 dark:text-gray-400 text-sm">
			Save analysis history and review past scan results anytime
		</p>
	</div>

	<div
		class="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
	>
		<div
			class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4"
		>
			<User class="w-6 h-6 text-purple-600 dark:text-purple-400" />
		</div>
		<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Better Experience</h3>
		<p class="text-gray-600 dark:text-gray-400 text-sm">
			Sign in to get more quota and synchronous scan
		</p>
	</div>
</div>
