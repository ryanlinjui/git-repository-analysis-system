import { z } from 'zod';
import { Timestamp } from './utils';

export const resultRoute = (resultId: string) => `/results/${resultId}`;
export const resultByScanRoute = (scanId: string) => `/scans/${scanId}/result`;

/**
 * Skill level classification
 */
export const SkillLevel = z.enum([
	'beginner',   // Simple projects, basic concepts
	'junior',     // Some complexity, common patterns
	'mid-level',  // Moderate complexity, established practices
	'senior'      // High complexity, advanced patterns
]);

export type SkillLevel = z.infer<typeof SkillLevel>;

/**
 * Technology detected in repository
 */
export const TechnologySchema = z.object({
	name: z.string(),
	category: z.enum([
		'language',
		'framework',
		'library',
		'tool',
		'platform',
		'database',
		'other'
	]),
	version: z.string().nullable().optional(),
	confidence: z.number().min(0).max(100).optional() // Detection confidence %
});

export type Technology = z.infer<typeof TechnologySchema>;

/**
 * File statistics
 */
export const FileStatsSchema = z.object({
	totalFiles: z.number(),
	totalLines: z.number().optional(),
	languageBreakdown: z.record(z.string(), z.number()).optional(), // { "TypeScript": 1500, "Python": 500 }
	largestFiles: z.array(z.object({
		path: z.string(),
		size: z.number(),
		lines: z.number().optional()
	})).max(10).optional()
});

export type FileStats = z.infer<typeof FileStatsSchema>;

/**
 * Repository structure analysis
 */
export const StructureAnalysisSchema = z.object({
	hasTests: z.boolean(),
	hasCI: z.boolean(),
	hasDocumentation: z.boolean(),
	hasLicense: z.boolean(),
	packageManagers: z.array(z.string()).default([]),
	buildTools: z.array(z.string()).default([]),
	dockerized: z.boolean().default(false),
	monorepo: z.boolean().default(false)
});

export type StructureAnalysis = z.infer<typeof StructureAnalysisSchema>;

/**
 * Scan Result Schema
 * Contains the analysis results for a completed scan
 */
export const ScanResultSchema = z.object({
	id: z.string().describe('Result ID (same as scan ID)'),
	scanId: z.string().describe('Reference to scan record'),
	
	// Core analysis results
	description: z.string().max(2000).describe('AI-generated project description'),
	
	// Technology stack
	techStack: z.array(TechnologySchema).describe('Detected technologies'),
	primaryLanguage: z.string().nullable().optional(),
	
	// Skill level assessment
	skillLevel: SkillLevel,
	skillLevelRationale: z.string().max(1000).optional(),
	
	// Detailed analysis
	fileStats: FileStatsSchema.optional(),
	structureAnalysis: StructureAnalysisSchema.optional(),
	
	// Additional insights
	codeQuality: z.object({
		score: z.number().min(0).max(100).optional(),
		issues: z.array(z.string()).optional(),
		strengths: z.array(z.string()).optional()
	}).optional(),
	
	complexity: z.object({
		score: z.number().min(0).max(100).optional(),
		factors: z.array(z.string()).optional()
	}).optional(),
	
	// AI metadata
	aiProvider: z.string().nullable().optional(),
	aiModel: z.string().nullable().optional(),
	
	// Timestamps
	createdAt: Timestamp,
	updatedAt: Timestamp
});

export type ScanResult = z.infer<typeof ScanResultSchema>;