<script lang="ts">
	import { LogIn, UserPlus, User, LayoutDashboard, LogOut } from 'lucide-svelte';
	import Auth from './Auth.svelte';

	interface Props {
		isLoggedIn?: boolean;
	}

	let { isLoggedIn = $bindable(false) }: Props = $props();
	let showDropdown = $state(false);
	let showAuthModal = $state(false);
	let authMode = $state<'login' | 'register'>('login');

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	function handleDashboard() {
		console.log('Navigate to dashboard');
		window.location.href = '/dashboard';
		showDropdown = false;
	}

	function handleLogout() {
		console.log('Logout clicked');
		isLoggedIn = false;
		alert('Logged out successfully!');
		showDropdown = false;
	}

	function openLoginModal() {
		authMode = 'login';
		showAuthModal = true;
	}

	function openRegisterModal() {
		authMode = 'register';
		showAuthModal = true;
	}

	function handleGithubAuth() {
		// TODO: Implement GitHub OAuth
		console.log('GitHub Auth:', authMode);
		showAuthModal = false;
		isLoggedIn = true;
		alert('Logged in successfully with GitHub!');
	}
</script>

<div class="flex items-center gap-3">
	{#if isLoggedIn}
		<div class="relative">
			<button
				onclick={toggleDropdown}
				class="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold hover:opacity-90 transition-opacity"
				aria-label="User profile"
			>
				<User class="w-5 h-5" />
			</button>

			<!-- Dropdown Menu -->
			{#if showDropdown}
				<div
					class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
				>
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
			onclick={openLoginModal}
			class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
		>
			<LogIn class="w-4 h-4" />
			<span class="hidden sm:inline">Login</span>
		</button>
		<button
			onclick={openRegisterModal}
			class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
		>
			<UserPlus class="w-4 h-4" />
			<span class="hidden sm:inline">Register</span>
		</button>
	{/if}
</div>

<!-- Auth Modal -->
<Auth
	show={showAuthModal}
	mode={authMode}
	onClose={() => (showAuthModal = false)}
	onGithubAuth={handleGithubAuth}
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

