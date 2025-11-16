<script lang="ts">
	import type { Repository } from '$lib/schema/repository';
	import { Code2, GitFork, Star, Calendar, Award, CheckCircle, XCircle, FileText, Package, Share2 } from 'lucide-svelte';
	import { formatRelativeTime } from '$lib/utils/date';

	interface Props {
		repository: Repository;
		scanId?: string;
	}

	let { repository, scanId }: Props = $props();

	// Share functionality
	let showCopiedMessage = $state(false);
	
	async function handleShare() {
		const shareUrl = scanId 
			? `${window.location.origin}/scan/${scanId}`
			: window.location.href;
		
		try {
			await navigator.clipboard.writeText(shareUrl);
			showCopiedMessage = true;
			setTimeout(() => {
				showCopiedMessage = false;
			}, 2000);
		} catch (error) {
			console.error('Failed to copy URL:', error);
			alert('Failed to copy URL. Please try again.');
		}
	}

	// Skill level colors
	const skillColors: Record<string, string> = {
		beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
		junior: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
		'mid-level': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
		senior: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
	};

	// Tech category colors
	const categoryColors: Record<string, string> = {
		language: 'bg-blue-500',
		framework: 'bg-green-500',
		library: 'bg-purple-500',
		tool: 'bg-orange-500',
		platform: 'bg-red-500',
		database: 'bg-yellow-500',
		other: 'bg-gray-500'
	};

	// Section component wrapper
	const Section = (props: { title: string; icon: any; children: any }) => `
		<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6 border border-gray-200 dark:border-gray-700">
			<div class="flex items-center gap-2 mb-6">
				<component:icon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
			</div>
			{children}
		</div>
	`;
</script>

<div class="max-w-6xl mx-auto px-4 py-8">
	<!-- Header -->
	<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6 border border-gray-200 dark:border-gray-700">
		<div class="flex items-start justify-between mb-4">
			<div class="flex-1">
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
					{repository.metadata.fullName}
				</h1>
				<a
					href={repository.metadata.url}
					target="_blank"
					rel="noopener noreferrer"
					class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
				>
					{repository.metadata.url} ↗
				</a>
			</div>
			<div class="flex items-center gap-3">
				<span class="px-4 py-2 rounded-full text-sm font-semibold {skillColors[repository.skillLevel]}">
					{repository.skillLevel.toUpperCase()}
				</span>
				<button
					onclick={handleShare}
					class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
					title="Share this analysis"
				>
					<Share2 class="w-4 h-4" />
					<span class="font-medium">Share</span>
				</button>
			</div>
		</div>

		{#if showCopiedMessage}
			<div class="mb-4 px-4 py-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
				<CheckCircle class="w-4 h-4" />
				<span>Link copied to clipboard!</span>
			</div>
		{/if}

		<!-- Metadata -->
		<div class="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
			{#if repository.metadata.stars !== null && repository.metadata.stars !== undefined}
				<div class="flex items-center gap-1">
					<Star class="w-4 h-4" />
					<span>{repository.metadata.stars.toLocaleString()} stars</span>
				</div>
			{/if}
			{#if repository.metadata.forks !== null && repository.metadata.forks !== undefined}
				<div class="flex items-center gap-1">
					<GitFork class="w-4 h-4" />
					<span>{repository.metadata.forks.toLocaleString()} forks</span>
				</div>
			{/if}
			{#if repository.primaryLanguage}
				<div class="flex items-center gap-1">
					<Code2 class="w-4 h-4" />
					<span>{repository.primaryLanguage}</span>
				</div>
			{/if}
			<div class="flex items-center gap-1">
				<Calendar class="w-4 h-4" />
				<span>Analyzed {formatRelativeTime(repository.lastScannedAt)}</span>
			</div>
		</div>
	</div>

	<!-- Description -->
	<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6 border border-gray-200 dark:border-gray-700">
		<div class="flex items-center gap-2 mb-4">
			<FileText class="w-5 h-5 text-blue-600 dark:text-blue-400" />
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Description</h2>
		</div>
		<p class="text-gray-700 dark:text-gray-300 leading-relaxed">
			{repository.description}
		</p>
	</div>

	<!-- Tech Stack -->
	<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6 border border-gray-200 dark:border-gray-700">
		<div class="flex items-center gap-2 mb-6">
			<Package class="w-5 h-5 text-blue-600 dark:text-blue-400" />
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Technology Stack</h2>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each repository.techStack as tech}
				<div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
					<div class="w-2 h-2 rounded-full {categoryColors[tech.category]}"></div>
					<div class="flex-1">
						<div class="font-semibold text-gray-900 dark:text-white">
							{tech.name}
						</div>
						<div class="text-xs text-gray-500 dark:text-gray-400">
							{tech.category}
							{#if tech.version}
								• {tech.version}
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Skill Level -->
	<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6 border border-gray-200 dark:border-gray-700">
		<div class="flex items-center gap-2 mb-4">
			<Award class="w-5 h-5 text-blue-600 dark:text-blue-400" />
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Skill Level Assessment</h2>
		</div>
		<div class="flex items-center gap-4 mb-4">
			<span class="px-6 py-3 rounded-lg text-lg font-bold {skillColors[repository.skillLevel]}">
				{repository.skillLevel.toUpperCase()}
			</span>
		</div>
		{#if repository.skillLevelRationale}
			<p class="text-gray-700 dark:text-gray-300 leading-relaxed">
				{repository.skillLevelRationale}
			</p>
		{/if}
	</div>

	<!-- Project Structure -->
	{#if repository.structureAnalysis}
		<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6 border border-gray-200 dark:border-gray-700">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Project Structure</h2>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="flex items-center gap-2">
					{#if repository.structureAnalysis.hasTests}
						<CheckCircle class="w-5 h-5 text-green-600" />
					{:else}
						<XCircle class="w-5 h-5 text-red-600" />
					{/if}
					<span class="text-gray-700 dark:text-gray-300">Tests</span>
				</div>
				<div class="flex items-center gap-2">
					{#if repository.structureAnalysis.hasCI}
						<CheckCircle class="w-5 h-5 text-green-600" />
					{:else}
						<XCircle class="w-5 h-5 text-red-600" />
					{/if}
					<span class="text-gray-700 dark:text-gray-300">CI/CD</span>
				</div>
				<div class="flex items-center gap-2">
					{#if repository.structureAnalysis.hasDocumentation}
						<CheckCircle class="w-5 h-5 text-green-600" />
					{:else}
						<XCircle class="w-5 h-5 text-red-600" />
					{/if}
					<span class="text-gray-700 dark:text-gray-300">Documentation</span>
				</div>
				<div class="flex items-center gap-2">
					{#if repository.structureAnalysis.hasLicense}
						<CheckCircle class="w-5 h-5 text-green-600" />
					{:else}
						<XCircle class="w-5 h-5 text-red-600" />
					{/if}
					<span class="text-gray-700 dark:text-gray-300">License</span>
				</div>
				<div class="flex items-center gap-2">
					{#if repository.structureAnalysis.dockerized}
						<CheckCircle class="w-5 h-5 text-green-600" />
					{:else}
						<XCircle class="w-5 h-5 text-red-600" />
					{/if}
					<span class="text-gray-700 dark:text-gray-300">Dockerized</span>
				</div>
				<div class="flex items-center gap-2">
					{#if repository.structureAnalysis.monorepo}
						<CheckCircle class="w-5 h-5 text-green-600" />
					{:else}
						<XCircle class="w-5 h-5 text-red-600" />
					{/if}
					<span class="text-gray-700 dark:text-gray-300">Monorepo</span>
				</div>
			</div>

			{#if repository.structureAnalysis.packageManagers.length > 0}
				<div class="mt-6">
					<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Package Managers</h3>
					<div class="flex flex-wrap gap-2">
						{#each repository.structureAnalysis.packageManagers as pm}
							<span class="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm">
								{pm}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if repository.structureAnalysis.buildTools.length > 0}
				<div class="mt-4">
					<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Build Tools</h3>
					<div class="flex flex-wrap gap-2">
						{#each repository.structureAnalysis.buildTools as tool}
							<span class="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-sm">
								{tool}
							</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- File Statistics -->
	{#if repository.fileStats}
		<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6 border border-gray-200 dark:border-gray-700">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">File Statistics</h2>
			<div class="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
				<div>
					<div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
						{repository.fileStats.totalFiles.toLocaleString()}
					</div>
					<div class="text-sm text-gray-600 dark:text-gray-400">Total Files</div>
				</div>
				{#if repository.fileStats.totalLines}
					<div>
						<div class="text-3xl font-bold text-green-600 dark:text-green-400">
							{repository.fileStats.totalLines.toLocaleString()}
						</div>
						<div class="text-sm text-gray-600 dark:text-gray-400">Lines of Code</div>
					</div>
				{/if}
				{#if repository.fileStats.languageBreakdown}
					<div>
						<div class="text-3xl font-bold text-purple-600 dark:text-purple-400">
							{Object.keys(repository.fileStats.languageBreakdown).length}
						</div>
						<div class="text-sm text-gray-600 dark:text-gray-400">Languages</div>
					</div>
				{/if}
			</div>

			{#if repository.fileStats.languageBreakdown}
				{@const sortedLanguages = Object.entries(repository.fileStats.languageBreakdown).sort(([, a], [, b]) => b - a).slice(0, 10)}
				{@const maxLines = sortedLanguages.length > 0 ? sortedLanguages[0][1] : 1}
				<div>
					<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Language Breakdown</h3>
					<div class="space-y-2">
						{#each sortedLanguages as [lang, lines]}
							<div>
								<div class="flex items-center justify-between text-sm mb-1">
									<span class="text-gray-700 dark:text-gray-300">{lang}</span>
									<span class="text-gray-600 dark:text-gray-400">{lines.toLocaleString()} lines</span>
								</div>
								<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
									<div
										class="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
										style="width: {(lines / maxLines) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Code Quality -->
	{#if repository.codeQuality}
		<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6 border border-gray-200 dark:border-gray-700">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Code Quality</h2>
			{#if repository.codeQuality.score !== undefined}
				<div class="mb-6">
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Overall Score</span>
						<span class="text-2xl font-bold text-blue-600 dark:text-blue-400">
							{repository.codeQuality.score}/100
						</span>
					</div>
					<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
						<div
							class="bg-blue-600 dark:bg-blue-500 h-4 rounded-full transition-all"
							style="width: {repository.codeQuality.score}%"
						></div>
					</div>
				</div>
			{/if}

			<div class="grid md:grid-cols-2 gap-6">
				{#if repository.codeQuality.strengths && repository.codeQuality.strengths.length > 0}
					<div>
						<h3 class="text-sm font-semibold text-green-700 dark:text-green-300 mb-3">✓ Strengths</h3>
						<ul class="space-y-2">
							{#each repository.codeQuality.strengths as strength}
								<li class="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
									<CheckCircle class="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
									<span>{strength}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if repository.codeQuality.issues && repository.codeQuality.issues.length > 0}
					<div>
						<h3 class="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-3">⚠ Potential Issues</h3>
						<ul class="space-y-2">
							{#each repository.codeQuality.issues as issue}
								<li class="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
									<XCircle class="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
									<span>{issue}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
