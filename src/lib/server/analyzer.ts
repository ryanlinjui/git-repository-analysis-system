import crypto from 'crypto';
import { now } from '$lib/utils/date';
import type { Repository } from '$lib/schema/repository';
import { analyzeWithGemini } from './llm';
import type { RepoSnapshot } from './constants';
import { TEMP_DIR_PREFIX, AI_MODEL } from './constants';
import { generateComprehensiveAnalysisPrompt } from './prompt';
import {
	cloneRepository,
	getRepoMetadata,
	getAllFiles,
	cleanupRepo
} from './git-utils';
import { isDummyRepo, generateDummyRepository } from './dummy';

/**
 * Generate unique repository ID from URL
 */
export function generateRepoId(url: string): string {
	const normalized = url.toLowerCase().replace(/\.git$/, '').replace(/\/$/, '');
	return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

/**
 * Create repository snapshot for AI analysis
 * Now much simpler - just collect files, let AI do all the analysis
 */
async function createRepoSnapshot(
	repoUrl: string, 
	repoDir: string,
	owner: string,
	name: string
): Promise<RepoSnapshot> {
	const metadata = await getRepoMetadata(repoUrl, repoDir, owner, name);
	const allFiles = await getAllFiles(repoDir);

	// Get README (support multiple formats)
	let readme: string | undefined;
	const readmeFile = allFiles.find(f => {
		const name = f.path.toLowerCase();
		return name === 'readme.md' || 
		       name === 'readme.rst' || 
		       name === 'readme.txt' || 
		       name === 'readme';
	});
	if (readmeFile) {
		readme = readmeFile.content;
	}

	return {
		metadata,
		files: allFiles,
		readme
	};
}

/**
 * Analyze repository and return complete result
 * Complete AI-driven analysis - AI determines everything!
 * 
 * Special case: If URL contains dummy/test keywords, returns mock data
 */
export async function analyzeRepository(
	repoUrl: string,
	geminiApiKey: string,
	onProgress?: (progress: number, message: string) => void
): Promise<Repository> {
	// === DUMMY DATA DETECTION ===
	// If URL contains dummy/test keywords, return mock data immediately
	if (isDummyRepo(repoUrl)) {
		console.log('🎭 Dummy repository detected! Returning mock data...');
		
		// Generate dummy data with progress simulation
		const dummyData = await generateDummyRepository(repoUrl, onProgress);
		
		console.log('✅ Mock data generated successfully!');
		console.log(`   ├─ Repository: ${dummyData.metadata.fullName}`);
		console.log(`   ├─ Primary Language: ${dummyData.primaryLanguage}`);
		console.log(`   ├─ Skill Level: ${dummyData.skillLevel}`);
		console.log(`   └─ Tech Stack: ${dummyData.techStack.length} technologies`);
		
		return dummyData;
	}

	const repoId = generateRepoId(repoUrl);
	const tmpDir = `${TEMP_DIR_PREFIX}${repoId}-${Date.now()}`;

	try {
		onProgress?.(0, '🚀 Starting repository analysis...');
		
		// Step 1: Clone repository
		onProgress?.(10, '📦 Cloning repository...');
		console.log('📦 Cloning repository from:', repoUrl);
		const { owner, name } = await cloneRepository(repoUrl, tmpDir);
		onProgress?.(25, '✅ Repository cloned');

		// Step 2: Fetch metadata
		onProgress?.(30, '🔍 Fetching repository metadata...');
		const metadata = await getRepoMetadata(repoUrl, tmpDir, owner, name);
		console.log(`✨ Repository: ${metadata.fullName}`);
		if (metadata.stars !== null && metadata.stars !== undefined) {
			console.log(`   ├─ ⭐ Stars: ${metadata.stars.toLocaleString()}`);
		}
		if (metadata.forks !== null && metadata.forks !== undefined) {
			console.log(`   ├─ 🍴 Forks: ${metadata.forks.toLocaleString()}`);
		}
		console.log(`   └─ 🌿 Branch: ${metadata.branch}`);
		onProgress?.(35, '✅ Metadata fetched');

		// Step 3: Collect files
		onProgress?.(40, '📊 Collecting repository files...');
		console.log('📊 Collecting files for AI analysis...');
		const snapshot = await createRepoSnapshot(repoUrl, tmpDir, owner, name);
		console.log(`   └─ Total files: ${snapshot.files.length}`);
		onProgress?.(50, `✅ Collected ${snapshot.files.length} files`);

		// === SINGLE AI ANALYSIS - Let AI do EVERYTHING ===
		onProgress?.(55, '🤖 AI analyzing repository comprehensively...');
		console.log('🤖 Comprehensive AI Analysis');
		console.log('   ├─ Sending repository to AI...');
		console.log('   ├─ AI will analyze: tech stack, structure, quality, complexity');
		console.log('   └─ This may take 30-60 seconds...');
		
		const prompt = generateComprehensiveAnalysisPrompt(snapshot);
		const analysis = await analyzeWithGemini(prompt, geminiApiKey);
		
		console.log('\n✅ AI Analysis Complete!');
		console.log(`   ├─ Description: ${analysis.description.slice(0, 80)}...`);
		console.log(`   ├─ Primary Language: ${analysis.primaryLanguage}`);
		console.log(`   ├─ Technologies: ${analysis.techStack.length} detected`);
		console.log(`   ├─ Code Quality: ${analysis.codeQuality.score}/100`);
		console.log(`   ├─ Skill Level: ${analysis.skillLevel}`);
		console.log(`   └─ Complexity: ${analysis.complexity.score}/100`);
		
		onProgress?.(95, '✅ AI analysis complete!');

		// Compile final result
		onProgress?.(98, '📋 Compiling results...');
		console.log('📋 Compiling final results...');

		const result: Repository = {
			repoId,
			metadata: {
				url: snapshot.metadata.url,
				fullName: snapshot.metadata.fullName,
				provider: snapshot.metadata.provider,
				branch: snapshot.metadata.branch,
				commitSha: snapshot.metadata.commitSha,
				stars: snapshot.metadata.stars,
				forks: snapshot.metadata.forks,
				lastUpdated: snapshot.metadata.lastUpdated,
				owner: snapshot.metadata.owner,
				name: snapshot.metadata.name
			},
			
			// All from AI analysis
			description: analysis.description,
			techStack: analysis.techStack,
			primaryLanguage: analysis.primaryLanguage,
			skillLevel: analysis.skillLevel,
			skillLevelRationale: analysis.skillLevelRationale,
			fileStats: analysis.fileStats,
			structureAnalysis: analysis.structure,
			codeQuality: analysis.codeQuality,
			complexity: analysis.complexity,
			
			// AI metadata
			aiModel: AI_MODEL,
			analyzedCommit: snapshot.metadata.commitSha,
			totalScans: 1,
			lastScannedAt: now(),
			createdAt: now(),
			updatedAt: now()
		};

		onProgress?.(100, '✅ Complete! AI-driven analysis finished');
		return result;
	} finally {
		console.log('🧹 Cleaning up...');
		await cleanupRepo(tmpDir);
		console.log('✅ Cleanup complete');
	}
}
