<script lang="ts">
	import Session from '$lib/components/Session.svelte';
	import Welcome from '$lib/components/Welcome.svelte';

	let repoUrl = $state('');

	function handleAnalyze(url: string) {
		console.log('Analyzing repository:', url);
		// TODO: Call API to analyze repository
		alert(`Start Analyzing: ${url}`);
	}
</script>

<div class="max-w-4xl mx-auto px-4 py-12">
	<!-- Welcome Section -->
	<Welcome />

	<!-- Session Component (Input & Button) -->
	<Session bind:repoUrl onAnalyze={handleAnalyze} />
</div>
