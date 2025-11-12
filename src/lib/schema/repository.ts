import { z } from 'zod';
import { Timestamp } from './utils';

export const route = (repoId: string) => `/repository/${repoId}`;

/**
 * Repository Analysis Result Schema
 * Contains the complete analysis results for a repository
 * Shared across all scans of the same repository
 */
export const RepositorySchema = z.object({
	repoId: z.string().describe('Unique repository identifier (hash of normalized URL)'),

	// Repository metadata
	metadata: z.object({
		url: z.string().url().describe('Repository URL'),
		owner: z.string().describe('Repository owner/organization'),
		name: z.string().describe('Repository name'),
		fullName: z.string().describe('Full repository name, e.g., "facebook/react"'),
		provider: z.enum(['github', 'gitlab', 'bitbucket']).describe('Git hosting provider'),
		branch: z.string().default('main').describe('Branch name'),
		commitSha: z.string().nullable().optional().describe('Latest commit SHA analyzed'),
		stars: z.number().nullable().optional().describe('Star count'),
		forks: z.number().nullable().optional().describe('Fork count'),
		lastUpdated: Timestamp.nullable().optional().describe('Last updated timestamp from provider')
	}).describe('Repository metadata from provider'),
	
	// Core analysis results
	description: z.string().max(2000).describe('AI-generated project description'),
	
	// Technology stack
	techStack: z.array(z.object({
		name: z.string().describe('Technology name'),
		category: z.enum([
			'language',
			'framework',
			'library',
			'tool',
			'platform',
			'database',
			'other'
		]).describe('Technology category'),
		version: z.string().nullable().optional().describe('Version if detected'),
		confidence: z.number().min(0).max(100).optional().describe('Detection confidence percentage')
	})).describe('Detected technologies'),
	
	primaryLanguage: z.string().nullable().optional().describe('Primary programming language'),
	
	// Skill level assessment
	skillLevel: z.enum([
		'beginner',   // Simple projects, basic concepts
		'junior',     // Some complexity, common patterns
		'mid-level',  // Moderate complexity, established practices
		'senior'      // High complexity, advanced patterns
	]).describe('Assessed skill level required'),
	
	skillLevelRationale: z.string().max(1000).optional().describe('Rationale for skill level assessment'),
	
	// Detailed analysis - File statistics
	fileStats: z.object({
		totalFiles: z.number().describe('Total number of files'),
		totalLines: z.number().optional().describe('Total lines of code'),
		languageBreakdown: z.record(z.string(), z.number()).optional().describe('Lines of code per language, e.g., { "TypeScript": 1500, "Python": 500 }'),
		largestFiles: z.array(z.object({
			path: z.string().describe('File path'),
			size: z.number().describe('File size in bytes'),
			lines: z.number().optional().describe('Number of lines')
		})).max(10).optional().describe('Top 10 largest files')
	}).optional().describe('File and code statistics'),
	
	// Detailed analysis - Structure
	structureAnalysis: z.object({
		hasTests: z.boolean().describe('Has test files'),
		hasCI: z.boolean().describe('Has CI/CD configuration'),
		hasDocumentation: z.boolean().describe('Has README or docs'),
		hasLicense: z.boolean().describe('Has LICENSE file'),
		packageManagers: z.array(z.string()).default([]).describe('Detected package managers, e.g., ["npm", "yarn"]'),
		buildTools: z.array(z.string()).default([]).describe('Detected build tools, e.g., ["webpack", "vite"]'),
		dockerized: z.boolean().default(false).describe('Has Dockerfile'),
		monorepo: z.boolean().default(false).describe('Is a monorepo')
	}).optional().describe('Project structure analysis'),
	
	// Additional insights - Code quality
	codeQuality: z.object({
		score: z.number().min(0).max(100).optional().describe('Overall code quality score'),
		issues: z.array(z.string()).optional().describe('Identified issues'),
		strengths: z.array(z.string()).optional().describe('Project strengths')
	}).optional().describe('Code quality assessment'),
	
	// Additional insights - Complexity
	complexity: z.object({
		score: z.number().min(0).max(100).optional().describe('Overall complexity score'),
		factors: z.array(z.string()).optional().describe('Complexity factors')
	}).optional().describe('Complexity analysis'),
	
	// AI metadata
	aiProvider: z.string().nullable().optional().describe('AI provider used, e.g., "openai", "anthropic"'),
	aiModel: z.string().nullable().optional().describe('AI model used, e.g., "gpt-4", "claude-3"'),
	
	// Cache metadata
	analyzedCommit: z.string().nullable().optional().describe('Commit SHA that was analyzed'),
	totalScans: z.number().default(1).describe('Number of times this repo has been scanned'),
	lastScannedAt: Timestamp.describe('Last time this repo was scanned'),
	
	// Timestamps
	createdAt: Timestamp,
	updatedAt: Timestamp
});

export type Repository = z.infer<typeof RepositorySchema>;