import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import type { RepoMetadata, FileInfo } from './types';

const execAsync = promisify(exec);

/**
 * Parse GitHub URL to get owner and repo name
 */
export function parseGitHubUrl(url: string): { owner: string; name: string } | null {
	// Support various GitHub URL formats
	const patterns = [
		/github\.com\/([^\/]+)\/([^\/\.]+)(\.git)?$/,
		/github\.com\/([^\/]+)\/([^\/]+)/
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) {
			return {
				owner: match[1],
				name: match[2].replace('.git', '')
			};
		}
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
 * Get repository metadata from GitHub API
 */
async function fetchGitHubMetadata(owner: string, name: string): Promise<{
	stars: number;
	forks: number;
	lastUpdated: Date;
} | null> {
	try {
		const response = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
			headers: {
				'Accept': 'application/vnd.github.v3+json',
				'User-Agent': 'Git-Repository-Analysis-System'
			}
		});

		if (!response.ok) {
			console.warn(`Failed to fetch GitHub metadata: ${response.status} ${response.statusText}`);
			return null;
		}

		const data = await response.json();
		
		return {
			stars: data.stargazers_count || 0,
			forks: data.forks_count || 0,
			lastUpdated: new Date(data.updated_at || data.pushed_at)
		};
	} catch (error) {
		console.warn('Failed to fetch GitHub metadata:', error);
		return null;
	}
}

/**
 * Get repository metadata
 */
export async function getRepoMetadata(repoUrl: string, repoDir: string): Promise<RepoMetadata> {
	const parsed = parseGitHubUrl(repoUrl);
	
	if (!parsed) {
		throw new Error('Invalid GitHub URL');
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

	// Fetch GitHub metadata
	console.log(`🔍 Fetching metadata from GitHub API for ${parsed.owner}/${parsed.name}...`);
	const githubData = await fetchGitHubMetadata(parsed.owner, parsed.name);

	return {
		url: repoUrl,
		owner: parsed.owner,
		name: parsed.name,
		fullName: `${parsed.owner}/${parsed.name}`,
		provider: 'github',
		branch,
		commitSha,
		stars: githubData?.stars || null,
		forks: githubData?.forks || null,
		lastUpdated: githubData?.lastUpdated || null
	};
}

/**
 * Get all files in directory recursively
 */
export async function getAllFiles(
	dir: string,
	baseDir: string = dir,
	ignorePatterns: RegExp[] = [
		/node_modules/,
		/\.git/,
		/dist/,
		/build/,
		/\.next/,
		/\.cache/,
		/coverage/,
		/\.vscode/,
		/\.idea/,
		/\.DS_Store/
	]
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
 * Detect language breakdown
 */
export function detectLanguageBreakdown(files: FileInfo[]): Record<string, number> {
	const breakdown: Record<string, number> = {};
	
	const extensionToLanguage: Record<string, string> = {
		'.ts': 'TypeScript',
		'.tsx': 'TypeScript',
		'.js': 'JavaScript',
		'.jsx': 'JavaScript',
		'.py': 'Python',
		'.java': 'Java',
		'.cpp': 'C++',
		'.c': 'C',
		'.cs': 'C#',
		'.go': 'Go',
		'.rs': 'Rust',
		'.rb': 'Ruby',
		'.php': 'PHP',
		'.swift': 'Swift',
		'.kt': 'Kotlin',
		'.html': 'HTML',
		'.css': 'CSS',
		'.scss': 'SCSS',
		'.vue': 'Vue',
		'.svelte': 'Svelte',
		'.md': 'Markdown',
		'.json': 'JSON',
		'.yaml': 'YAML',
		'.yml': 'YAML',
		'.toml': 'TOML',
		'.sh': 'Shell',
		'.sql': 'SQL'
	};

	for (const file of files) {
		const ext = path.extname(file.path).toLowerCase();
		const language = extensionToLanguage[ext] || 'Other';
		
		if (!breakdown[language]) {
			breakdown[language] = 0;
		}
		breakdown[language] += file.lines;
	}

	return breakdown;
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
