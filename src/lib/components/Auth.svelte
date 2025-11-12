<script lang="ts">
	import { X, Github } from 'lucide-svelte';
	import { signInWithGithub, firebaseUser } from '$lib/stores/auth';

	interface Props {
		show?: boolean;
		onClose?: () => void;
	}

	let { show = false, onClose }: Props = $props();

	async function handleGithubClick() {
		try {
			await signInWithGithub();
			onClose?.();
		} catch (error) {
			console.error('Authentication failed:', error);
		}
	}

	function handleClose() {
		onClose?.();
	}

	// Close modal if user is already logged in
	$effect(() => {
		if ($firebaseUser && show) {
			onClose?.();
		}
	});
</script>

{#if show}
	<!-- Show Auth Windows -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-s animate-in fade-in duration-200"
		role="presentation"
		onclick={handleClose}
	>
		<div
			class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200"
			role="dialog"
			aria-modal="true"
		>
			<div class="relative bg-gray-200 dark:bg-gray-850 p-8 text-center border-b border-gray-200 dark:border-gray-800">
				<button
					onclick={handleClose}
					class="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-all"
					aria-label="Close"
				>
					<X class="w-5 h-5" />
				</button>
				
				<div class="w-16 h-16 mx-auto mb-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-700 shadow-sm">
					<Github class="w-8 h-8 text-gray-700 dark:text-gray-300" />
				</div>
				
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
					Welcome to GitRepoScanner
				</h2>
				<p class="text-gray-600 dark:text-gray-400">
					Start with GitHub Account
				</p>
			</div>

			<div class="p-8">
				<div class="space-y-4">
					<!-- GitHub Button -->
					<button
						onclick={handleGithubClick}
						class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-800 hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 text-white rounded-xl transition-all font-medium shadow-md hover:shadow-lg"
					>
						<Github class="w-5 h-5" />
						<span>Continue with GitHub</span>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
