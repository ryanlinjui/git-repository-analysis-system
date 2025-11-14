import type { Repository, TechStackItem, FileStats, StructureAnalysis, CodeQuality, Complexity, SkillLevel } from '$lib/schema/repository';

/**
 * Server Constants
 */

// AI model configuration
export const AI_MODEL = 'gemini-2.0-flash';

/**
 * Git Repository Analysis Configuration
 */

// Temporary directory prefix for cloning repositories
export const TEMP_DIR_PREFIX = '/tmp/repo-analysis-';

// Files/directories to ignore during analysis (to avoid sending garbage to AI)
export const IGNORE_PATTERNS = [
	/node_modules/,
	/\.git/,
	/dist/,
	/build/,
	/\.next/,
	/\.cache/,
	/coverage/,
	/\.vscode/,
	/\.idea/,
	/\.DS_Store/,
	/\.nuxt/,
	/\.output/,
	/vendor/,
	/__pycache__/,
	/\.pytest_cache/,
	/\.mypy_cache/,
	/target\//, // Rust
	/out\//, // Various build outputs
	/public\/build/, // SvelteKit build
	/\.min\.js$/, // Minified files
	/\.bundle\.js$/, // Bundled files
	/\.map$/, // Source maps
];

/**
 * Git Hosting Providers URL Patterns
 */
export const GIT_PROVIDER_PATTERNS = {
	github: [
		/github\.com\/([^\/]+)\/([^\/\.]+)(\.git)?$/,
		/github\.com\/([^\/]+)\/([^\/]+)/
	],
	gitlab: [
		/gitlab\.com\/([^\/]+)\/([^\/\.]+)(\.git)?$/,
		/gitlab\.com\/([^\/]+)\/([^\/]+)/
	],
	bitbucket: [
		/bitbucket\.org\/([^\/]+)\/([^\/\.]+)(\.git)?$/,
		/bitbucket\.org\/([^\/]+)\/([^\/]+)/
	]
};

/**
 * API Endpoints for Git Providers
 */
export const GIT_PROVIDER_API = {
	github: 'https://api.github.com/repos',
	gitlab: 'https://gitlab.com/api/v4/projects',
	bitbucket: 'https://api.bitbucket.org/2.0/repositories'
};

/**
 * AI Analysis Result Types
 * Single comprehensive analysis from AI
 * Uses schema types from repository.ts to avoid duplication
 */
export interface AnalysisResult {
	// Project Overview
	description: string;
	primaryLanguage: string;
	
	// Technology Stack (AI-detected from actual usage)
	techStack: TechStackItem[];
	
	// File Statistics (AI-analyzed from content)
	fileStats: FileStats;
	
	// Project Structure (AI-detected from actual usage)
	structure: StructureAnalysis;
	
	// Code Quality Assessment
	codeQuality: CodeQuality;
	
	// Complexity & Skill Level
	skillLevel: SkillLevel;
	skillLevelRationale: string;
	complexity: Complexity;
}

/**
 * Internal Types for Processing
 * These are temporary data structures used during analysis
 * Data is NOT stored in Firestore - only used in memory
 */

/**
 * File information with content
 * Content is NOT saved to database - only used for AI analysis
 */
export interface FileInfo {
	path: string;
	content: string; // Full file content (not stored in DB)
	size: number;
	lines: number;
}

/**
 * Repository snapshot for AI analysis
 * Temporary data structure containing full file contents
 */
export interface RepoSnapshot {
	metadata: Repository['metadata'] & { 
		owner: string;  // Temporary field for processing
		name: string;   // Temporary field for processing
	};
	files: FileInfo[];
	readme?: string;
	packageJson?: any;
	// Structure analysis removed - AI will determine everything
}
