import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import type { Repository } from '$lib/schema/repository';
import type { RepoSnapshot } from './types';
import { analyzeWithGemini } from './llm';
import { generateAnalysisPrompt } from './prompt';
import {
	cloneRepository,
	getRepoMetadata,
	getAllFiles,
	detectLanguageBreakdown,
	cleanupRepo
} from './git-utils';

/**
 * Generate unique repository ID from URL
 */
export function generateRepoId(url: string): string {
	const normalized = url.toLowerCase().replace(/\.git$/, '').replace(/\/$/, '');
	return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

/**
 * Analyze repository structure
 */
async function analyzeStructure(repoDir: string, files: string[]) {
	const fileSet = new Set(files.map(f => f.toLowerCase()));
	
	// Detect package managers
	const packageManagers: string[] = [];
	if (fileSet.has('package.json')) packageManagers.push('npm');
	if (fileSet.has('yarn.lock')) packageManagers.push('yarn');
	if (fileSet.has('pnpm-lock.yaml')) packageManagers.push('pnpm');
	if (fileSet.has('requirements.txt') || fileSet.has('setup.py') || fileSet.has('pyproject.toml')) {
		packageManagers.push('pip');
	}
	if (fileSet.has('composer.json')) packageManagers.push('composer');
	if (fileSet.has('cargo.toml')) packageManagers.push('cargo');

	// Detect build tools
	const buildTools: string[] = [];
	if (fileSet.has('webpack.config.js') || fileSet.has('webpack.config.ts')) buildTools.push('webpack');
	if (fileSet.has('vite.config.js') || fileSet.has('vite.config.ts')) buildTools.push('vite');
	if (fileSet.has('rollup.config.js')) buildTools.push('rollup');
	if (fileSet.has('tsconfig.json')) buildTools.push('typescript');

	return {
		totalFiles: files.length,
		directories: [],
		hasTests: files.some(f => 
			f.includes('test') || 
			f.includes('spec') || 
			f.includes('__tests__')
		),
		hasCI: files.some(f => 
			f.includes('.github/workflows') || 
			f.includes('.gitlab-ci.yml') || 
			f.includes('.travis.yml') ||
			f.includes('circle.yml')
		),
		hasDocumentation: files.some(f => 
			f.toLowerCase() === 'readme.md' || 
			f.toLowerCase() === 'readme' ||
			f.startsWith('docs/')
		),
		hasLicense: files.some(f => f.toLowerCase().startsWith('license')),
		packageManagers,
		buildTools,
		dockerized: fileSet.has('dockerfile') || fileSet.has('docker-compose.yml'),
		monorepo: fileSet.has('lerna.json') || fileSet.has('nx.json') || 
		         (fileSet.has('package.json') && files.filter(f => f.endsWith('package.json')).length > 1)
	};
}

/**
 * Create repository snapshot for analysis
 */
async function createRepoSnapshot(repoUrl: string, repoDir: string): Promise<RepoSnapshot> {
	const metadata = await getRepoMetadata(repoUrl, repoDir);
	const allFiles = await getAllFiles(repoDir);
	const filePaths = allFiles.map(f => f.path);
	const structure = await analyzeStructure(repoDir, filePaths);
	const languageBreakdown = detectLanguageBreakdown(allFiles);

	// Get README
	let readme: string | undefined;
	const readmeFile = allFiles.find(f => f.path.toLowerCase() === 'readme.md');
	if (readmeFile) {
		readme = readmeFile.content;
	}

	// Get package.json
	let packageJson: any;
	const packageJsonFile = allFiles.find(f => f.path === 'package.json');
	if (packageJsonFile) {
		try {
			packageJson = JSON.parse(packageJsonFile.content);
		} catch (error) {
			console.warn('Failed to parse package.json:', error);
		}
	}

	return {
		metadata,
		files: allFiles,
		structure,
		languageBreakdown,
		readme,
		packageJson
	};
}

/**
 * Analyze repository and return complete result
 */
export async function analyzeRepository(
	repoUrl: string,
	geminiApiKey: string,
	onProgress?: (progress: number, message: string) => void
): Promise<Repository> {
	const repoId = generateRepoId(repoUrl);
	const tmpDir = `/tmp/repo-analysis-${repoId}-${Date.now()}`;

	try {
		onProgress?.(0, '🚀 Starting repository analysis...');
		
		onProgress?.(5, '📦 Cloning repository...');
		console.log('📦 Cloning repository from:', repoUrl);
		await cloneRepository(repoUrl, tmpDir);
		onProgress?.(20, '✅ Repository cloned successfully');

		onProgress?.(22, '🔍 Fetching repository metadata...');
		const metadata = await getRepoMetadata(repoUrl, tmpDir);
		console.log(`✨ Repository: ${metadata.fullName}`);
		if (metadata.stars !== null && metadata.stars !== undefined) {
			console.log(`   ├─ ⭐ Stars: ${metadata.stars.toLocaleString()}`);
		}
		if (metadata.forks !== null && metadata.forks !== undefined) {
			console.log(`   ├─ 🍴 Forks: ${metadata.forks.toLocaleString()}`);
		}
		console.log(`   └─ 🌿 Branch: ${metadata.branch}`);
		onProgress?.(25, '✅ Metadata fetched');

		onProgress?.(30, '📊 Scanning repository files...');
		console.log('📊 Scanning repository files...');
		const snapshot = await createRepoSnapshot(repoUrl, tmpDir);
		console.log(`   ├─ Total files: ${snapshot.structure.totalFiles}`);
		console.log(`   ├─ Languages detected: ${Object.keys(snapshot.languageBreakdown).length}`);
		console.log(`   └─ Primary language: ${Object.entries(snapshot.languageBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'}`);
		onProgress?.(50, `✅ Scanned ${snapshot.structure.totalFiles} files`);

		onProgress?.(55, '🔍 Analyzing project structure...');
		console.log('🔍 Project structure:');
		console.log(`   ├─ Tests: ${snapshot.structure.hasTests ? '✓' : '✗'}`);
		console.log(`   ├─ CI/CD: ${snapshot.structure.hasCI ? '✓' : '✗'}`);
		console.log(`   ├─ Documentation: ${snapshot.structure.hasDocumentation ? '✓' : '✗'}`);
		console.log(`   ├─ License: ${snapshot.structure.hasLicense ? '✓' : '✗'}`);
		console.log(`   ├─ Package managers: ${snapshot.structure.packageManagers.join(', ') || 'None'}`);
		console.log(`   └─ Build tools: ${snapshot.structure.buildTools.join(', ') || 'None'}`);
		onProgress?.(60, '✅ Structure analysis complete');

		onProgress?.(65, '📝 Generating AI analysis prompt...');
		const prompt = generateAnalysisPrompt(snapshot);
		const promptSize = (prompt.length / 1024).toFixed(2);
		console.log(`📝 Prompt generated (${promptSize} KB)`);
		onProgress?.(70, `✅ Prompt ready (${promptSize} KB)`);

		onProgress?.(75, '🤖 Analyzing with Gemini AI (this may take 30-60 seconds)...');
		console.log('🤖 Sending request to Gemini AI...');
		const aiAnalysis = await analyzeWithGemini(prompt, geminiApiKey);
		console.log('✅ AI analysis received');
		console.log(`   ├─ Description: ${aiAnalysis.description.slice(0, 100)}...`);
		console.log(`   ├─ Technologies: ${aiAnalysis.techStack.length} detected`);
		console.log(`   ├─ Skill level: ${aiAnalysis.skillLevel}`);
		console.log(`   └─ Code quality: ${aiAnalysis.codeQuality?.score || 'N/A'}/100`);
		onProgress?.(90, '✅ AI analysis complete');

		onProgress?.(95, '📋 Compiling final results...');
		console.log('📋 Compiling final results...');

		// Get top 10 largest files
		const largestFiles = snapshot.files
			.sort((a, b) => b.size - a.size)
			.slice(0, 10)
			.map(f => ({
				path: f.path,
				size: f.size,
				lines: f.lines
			}));

		const now = new Date();

		const result: Repository = {
			repoId,
			metadata: {
				url: snapshot.metadata.url,
				owner: snapshot.metadata.owner,
				name: snapshot.metadata.name,
				fullName: snapshot.metadata.fullName,
				provider: snapshot.metadata.provider,
				branch: snapshot.metadata.branch,
				commitSha: snapshot.metadata.commitSha,
				stars: snapshot.metadata.stars,
				forks: snapshot.metadata.forks,
				lastUpdated: snapshot.metadata.lastUpdated
			},
			description: aiAnalysis.description,
			techStack: aiAnalysis.techStack,
			primaryLanguage: aiAnalysis.primaryLanguage,
			skillLevel: aiAnalysis.skillLevel,
			skillLevelRationale: aiAnalysis.skillLevelRationale,
			fileStats: {
				totalFiles: snapshot.structure.totalFiles,
				totalLines: Object.values(snapshot.languageBreakdown).reduce((sum, lines) => sum + lines, 0),
				languageBreakdown: snapshot.languageBreakdown,
				largestFiles
			},
			structureAnalysis: snapshot.structure,
			codeQuality: aiAnalysis.codeQuality,
			complexity: aiAnalysis.complexity,
			aiProvider: 'google',
			aiModel: 'gemini-2.0-flash',
			analyzedCommit: snapshot.metadata.commitSha,
			totalScans: 1,
			lastScannedAt: now,
			createdAt: now,
			updatedAt: now
		};

		onProgress?.(100, '✅ Analysis complete!');
		return result;
	} finally {
		// Clean up
		console.log('🧹 Cleaning up temporary files...');
		await cleanupRepo(tmpDir);
		console.log('✅ Cleanup complete');
	}
}
