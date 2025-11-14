import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import type { Repository } from '$lib/schema/repository';
import type { FileInfo, RepoSnapshot } from './constants';
import { 
	GIT_PROVIDER_PATTERNS, 
	GIT_PROVIDER_API, 
	IGNORE_PATTERNS
} from './constants';

const execAsync = promisify(exec);

/**
 * Parse Git repository URL to get provider, owner and repo name
 * Supports GitHub, GitLab, Bitbucket, and any Git server
 * Includes security validation to prevent SSRF attacks
 */
export function parseGitUrl(url: string): { 
	provider: 'github' | 'gitlab' | 'bitbucket' | 'other'; 
	owner: string; 
	name: string;
	host?: string; // For self-hosted instances
} | null {
	// Security: Validate URL format
	if (!url || typeof url !== 'string') {
		return null;
	}

	// Security: Prevent localhost and private IP addresses (SSRF protection)
	const BLOCKED_HOSTS = [
		/localhost/i,
		/127\.0\.0\./,
		/192\.168\./,
		/10\.\d+\.\d+\.\d+/,
		/172\.(1[6-9]|2[0-9]|3[0-1])\./,
		/0\.0\.0\.0/,
		/::1/,
		/file:\/\//i
	];

	if (BLOCKED_HOSTS.some(pattern => pattern.test(url))) {
		console.warn('Blocked potentially dangerous URL:', url);
		return null;
	}

	// Security: Must use HTTPS or SSH
	if (!url.startsWith('https://') && !url.startsWith('git@')) {
		console.warn('URL must use HTTPS or SSH protocol');
		return null;
	}

	// Security: Check URL length (prevent DoS)
	if (url.length > 500) {
		console.warn('URL too long');
		return null;
	}

	// Try known providers first
	for (const [provider, patterns] of Object.entries(GIT_PROVIDER_PATTERNS)) {
		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match) {
				return {
					provider: provider as 'github' | 'gitlab' | 'bitbucket',
					owner: match[1],
					name: match[2].replace('.git', '')
				};
			}
		}
	}

	// Fallback: Try to parse any Git URL (including self-hosted)
	// Pattern: http(s)://domain/owner/repo or git@domain:owner/repo
	const httpPattern = /https?:\/\/([^\/]+)\/([^\/]+)\/([^\/\.]+)(\.git)?$/;
	const sshPattern = /git@([^:]+):([^\/]+)\/([^\/\.]+)(\.git)?$/;
	
	let match = url.match(httpPattern) || url.match(sshPattern);
	if (match) {
		return {
			provider: 'other',
			host: match[1],
			owner: match[2],
			name: match[3].replace('.git', '')
		};
	}

	return null;
}

/**
 * Clone repository to temporary directory
 */
export async function cloneRepository(repoUrl: string, targetDir: string): Promise<void> {
	try {
		await execAsync(`git clone --depth 1 "${repoUrl}" "${targetDir}"`);
	} catch (error) {
		throw new Error(`Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
 * Get repository metadata
 */
export async function getRepoMetadata(
	repoUrl: string, 
	repoDir: string
): Promise<Repository['metadata'] & { owner: string; name: string }> {
	const parsed = parseGitUrl(repoUrl);
	
	if (!parsed) {
		throw new Error('Invalid or unsupported Git repository URL. Supported platforms: GitHub, GitLab, Bitbucket');
	}

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
	console.log(`🔍 Fetching metadata from ${parsed.provider.toUpperCase()} API for ${parsed.owner}/${parsed.name}...`);
	const gitData = await fetchGitMetadata(parsed.provider, parsed.owner, parsed.name);

	return {
		url: repoUrl,
		owner: parsed.owner,
		name: parsed.name,
		fullName: `${parsed.owner}/${parsed.name}`,
		provider: parsed.provider,
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
 * Clean up cloned repository
 */
export async function cleanupRepo(repoDir: string): Promise<void> {
	try {
		await fs.rm(repoDir, { recursive: true, force: true });
	} catch (error) {
		console.warn('Failed to cleanup repository:', error);
	}
}
