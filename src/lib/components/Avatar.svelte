<script lang="ts">
	import { LogIn, UserPlus, LayoutDashboard, LogOut } from 'lucide-svelte';
	import { user, signOut, goToDashboard } from '$lib/stores/auth';
	import Auth from './Auth.svelte';

	let showDropdown = $state(false);
	let showAuthModal = $state(false);

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	function handleDashboard() {
		if ($user) {
			goToDashboard($user.uid);
		}
		showDropdown = false;
	}

	async function handleLogout() {
		try {
			await signOut();
			showDropdown = false;
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}

	function openAuthModal() {
		showAuthModal = true;
	}
</script>

<div class="flex items-center gap-3">
	{#if $user}
		<div class="relative">
			<button
				onclick={toggleDropdown}
				class="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold hover:opacity-90 transition-opacity overflow-hidden"
				aria-label="User profile"
			>
				<img 
					src={$user.photoURL} 
					alt={$user.displayName} 
					class="w-full h-full object-cover"
				/>
			</button>

			<!-- Dropdown Menu -->
			{#if showDropdown}
				<div
					class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
				>
					<div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
						<p class="text-sm font-medium text-gray-900 dark:text-white truncate">
							{$user.displayName}
						</p>
						<p class="text-xs text-gray-500 dark:text-gray-400">
							{$user.provider}
						</p>
					</div>
					<button
						onclick={handleDashboard}
						class="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						<LayoutDashboard class="w-4 h-4" />
						<span>Dashboard</span>
					</button>
					<hr class="my-1 border-gray-200 dark:border-gray-700" />
					<button
						onclick={handleLogout}
						class="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						<LogOut class="w-4 h-4" />
						<span>Logout</span>
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<button
			onclick={openAuthModal}
			class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
		>
			<LogIn class="w-4 h-4" />
			<span class="hidden sm:inline">Login</span>
		</button>
		<button
			onclick={openAuthModal}
			class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
		>
			<UserPlus class="w-4 h-4" />
			<span class="hidden sm:inline">Register</span>
		</button>
	{/if}
</div>

<Auth
	show={showAuthModal}
	onClose={() => (showAuthModal = false)}
/>

<svelte:window
	onclick={(e) => {
		if (showDropdown) {
			const target = e.target as HTMLElement;
			if (!target.closest('.relative')) {
				showDropdown = false;
			}
		}
	}}
/>
