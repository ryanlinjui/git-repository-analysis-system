import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import type { Repository } from '$lib/schema/repository';
import type { FileInfo, RepoSnapshot } from './constants';
import { 
	GIT_PROVIDER_API, 
	IGNORE_PATTERNS
} from './constants';

const execAsync = promisify(exec);

/**
 * Clone repository and extract owner/name from git remote
 * Returns repo info directly without parsing URL strings
 */
export async function cloneRepository(repoUrl: string, targetDir: string): Promise<{
	owner: string;
	name: string;
}> {
	// Clone the repository
	try {
		await execAsync(`git clone --depth 1 "${repoUrl}" "${targetDir}"`);
	} catch (error) {
		throw new Error(`Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}

	// Read owner/name from git config after clone
	try {
		const { stdout } = await execAsync('git config --get remote.origin.url', { cwd: targetDir });
		const remoteUrl = stdout.trim();
		
		// Extract owner/name using regex (supports HTTPS and SSH formats)
		// HTTPS: https://github.com/owner/repo.git
		// SSH: git@github.com:owner/repo.git
		const match = remoteUrl.match(/[:/]([^/]+)\/([^/]+?)(\.git)?$/);
		
		if (!match) {
			throw new Error(`Failed to extract owner/name from git remote URL: ${remoteUrl}`);
		}
		
		return {
			owner: match[1],
			name: match[2]
		};
	} catch (error) {
		throw new Error(`Failed to get repository info from git: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Fetch repository metadata from Git provider API
 * Supports GitHub, GitLab, Bitbucket
 * Returns null for self-hosted or unknown providers
 */
async function fetchGitMetadata(
	provider: 'github' | 'gitlab' | 'bitbucket' | 'other',
	owner: string, 
	name: string
): Promise<{
	stars: number;
	forks: number;
	lastUpdated: Date;
} | null> {
	// Skip API calls for self-hosted or unknown providers
	if (provider === 'other') {
		console.log('   ⚠️  Self-hosted or unknown Git provider - skipping metadata fetch');
		return null;
	}

	try {
		let apiUrl: string;
		let headers: Record<string, string>;

		switch (provider) {
			case 'github':
				apiUrl = `${GIT_PROVIDER_API.github}/${owner}/${name}`;
				headers = {
					'Accept': 'application/vnd.github.v3+json',
					'User-Agent': 'Git-Repository-Analysis-System'
				};
				break;
			
			case 'gitlab':
				// GitLab uses project ID or URL-encoded path
				const projectPath = encodeURIComponent(`${owner}/${name}`);
				apiUrl = `${GIT_PROVIDER_API.gitlab}/${projectPath}`;
				headers = {
					'Accept': 'application/json'
				};
				break;
			
			case 'bitbucket':
				apiUrl = `${GIT_PROVIDER_API.bitbucket}/${owner}/${name}`;
				headers = {
					'Accept': 'application/json'
				};
				break;
		}

		const response = await fetch(apiUrl, { headers });

		if (!response.ok) {
			console.warn(`Failed to fetch ${provider} metadata: ${response.status} ${response.statusText}`);
			return null;
		}

		const data = await response.json();
		
		// Map provider-specific response to common format
		switch (provider) {
			case 'github':
				return {
					stars: data.stargazers_count || 0,
					forks: data.forks_count || 0,
					lastUpdated: new Date(data.updated_at || data.pushed_at)
				};
			
			case 'gitlab':
				return {
					stars: data.star_count || 0,
					forks: data.forks_count || 0,
					lastUpdated: new Date(data.last_activity_at)
				};
			
			case 'bitbucket':
				return {
					stars: 0, // Bitbucket doesn't have stars, only watchers
					forks: 0, // Would need additional API call
					lastUpdated: new Date(data.updated_on)
				};
		}
	} catch (error) {
		console.warn(`Failed to fetch ${provider} metadata:`, error);
		return null;
	}
}

/**
 * Determine Git provider from URL
 * Simple pattern matching without full URL parsing
 */
function detectProvider(url: string): 'github' | 'gitlab' | 'bitbucket' | 'other' {
	const lowerUrl = url.toLowerCase();
	
	if (lowerUrl.includes('github.com')) return 'github';
	if (lowerUrl.includes('gitlab.com')) return 'gitlab';
	if (lowerUrl.includes('bitbucket.org')) return 'bitbucket';
	
	return 'other';
}

/**
 * Get repository metadata
 * Uses git remote data instead of parsing URL strings
 */
export async function getRepoMetadata(
	repoUrl: string, 
	repoDir: string,
	owner: string,
	name: string
): Promise<Repository['metadata']> {
	// Determine provider from URL for API calls
	const provider = detectProvider(repoUrl);

	// Get current commit SHA
	let commitSha: string | null = null;
	try {
		const { stdout } = await execAsync('git rev-parse HEAD', { cwd: repoDir });
		commitSha = stdout.trim();
	} catch (error) {
		console.warn('Failed to get commit SHA:', error);
	}

	// Get branch name
	let branch = 'main';
	try {
		const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoDir });
		branch = stdout.trim();
	} catch (error) {
		console.warn('Failed to get branch name:', error);
	}

	// Fetch metadata from Git provider API
	console.log(`🔍 Fetching metadata from ${provider.toUpperCase()} API for ${owner}/${name}...`);
	const gitData = await fetchGitMetadata(provider, owner, name);

	return {
		url: repoUrl,
		owner,
		name,
		fullName: `${owner}/${name}`,
		provider,
		branch,
		commitSha,
		stars: gitData?.stars || null,
		forks: gitData?.forks || null,
		lastUpdated: gitData?.lastUpdated || null
	};
}

/**
 * Get all files in directory recursively
 */
export async function getAllFiles(
	dir: string,
	baseDir: string = dir,
	ignorePatterns: RegExp[] = IGNORE_PATTERNS
): Promise<FileInfo[]> {
	const files: FileInfo[] = [];
	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		const relativePath = path.relative(baseDir, fullPath);

		// Skip ignored patterns
		if (ignorePatterns.some(pattern => pattern.test(relativePath))) {
			continue;
		}

		if (entry.isDirectory()) {
			const subFiles = await getAllFiles(fullPath, baseDir, ignorePatterns);
			files.push(...subFiles);
		} else if (entry.isFile()) {
			try {
				const stats = await fs.stat(fullPath);
				const content = await fs.readFile(fullPath, 'utf-8');
				const lines = content.split('\n').length;

				files.push({
					path: relativePath,
					content,
					size: stats.size,
					lines
				});
			} catch (error) {
				// Skip binary files or files that can't be read
				console.warn(`Skipping file ${relativePath}:`, error);
			}
		}
	}

	return files;
}

/**
 * Get latest commit SHA from remote repository without full clone
 * Uses git ls-remote to quickly check the latest commit
 */
export async function getLatestCommitSha(
	repoUrl: string,
	branch: string = 'main'
): Promise<string | null> {
	try {
		// Try the specified branch first
		const { stdout } = await execAsync(`git ls-remote "${repoUrl}" "${branch}"`);
		if (stdout.trim()) {
			const sha = stdout.split('\t')[0];
			return sha;
		}
		
		// If branch not found, try HEAD
		const { stdout: headOutput } = await execAsync(`git ls-remote "${repoUrl}" HEAD`);
		if (headOutput.trim()) {
			const sha = headOutput.split('\t')[0];
			return sha;
		}
		
		return null;
	} catch (error) {
		console.warn('Failed to get latest commit SHA:', error);
		return null;
	}
}

/**
 * Clean up cloned repository
 */
export async function cleanupRepo(repoDir: string): Promise<void> {
	try {
		await fs.rm(repoDir, { recursive: true, force: true });
	} catch (error) {
		console.warn('Failed to cleanup repository:', error);
	}
}
