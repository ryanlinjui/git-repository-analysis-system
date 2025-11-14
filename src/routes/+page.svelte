<script lang="ts">
	import Welcome from '$lib/components/Welcome.svelte';
	import ScanArea from '$lib/components/ScanArea.svelte';
	import RateLimits from '$lib/components/RateLimits.svelte';
</script>

<svelte:head>
	<title>Git Repository Analysis System</title>
	<meta name="description" content="Analyze any GitHub repository and get AI-powered insights about tech stack, code quality, and complexity" />
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-12">
	<!-- Welcome Section -->
	<Welcome />

	<!-- Quota Display -->
	<RateLimits />

	<!-- Scan Area (RepoURL Input + Submit + Last Scan for Anonymous Users) -->
	<ScanArea />
</div>
