/**
 * Repository metadata from Git provider
 */
export interface RepoMetadata {
	url: string;
	owner: string;
	name: string;
	fullName: string;
	provider: 'github' | 'gitlab' | 'bitbucket';
	branch: string;
	commitSha?: string | null;
	stars?: number | null;
	forks?: number | null;
	lastUpdated?: Date | null;
}

/**
 * File information
 */
export interface FileInfo {
	path: string;
	content: string;
	size: number;
	lines: number;
}

/**
 * Repository snapshot for analysis
 */
export interface RepoSnapshot {
	metadata: RepoMetadata;
	files: FileInfo[];
	structure: {
		totalFiles: number;
		directories: string[];
		hasTests: boolean;
		hasCI: boolean;
		hasDocumentation: boolean;
		hasLicense: boolean;
		packageManagers: string[];
		buildTools: string[];
		dockerized: boolean;
		monorepo: boolean;
	};
	languageBreakdown: Record<string, number>;
	readme?: string;
	packageJson?: any;
}

/**
 * Technology detection
 */
export interface Technology {
	name: string;
	category: 'language' | 'framework' | 'library' | 'tool' | 'platform' | 'database' | 'other';
	version?: string | null;
	confidence?: number;
}

/**
 * Analysis result from AI
 */
export interface AnalysisResult {
	description: string;
	techStack: Technology[];
	primaryLanguage: string | null;
	skillLevel: 'beginner' | 'junior' | 'mid-level' | 'senior';
	skillLevelRationale?: string;
	codeQuality?: {
		score?: number;
		issues?: string[];
		strengths?: string[];
	};
	complexity?: {
		score?: number;
		factors?: string[];
	};
}
