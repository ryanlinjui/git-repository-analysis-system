import type { RepoSnapshot } from './constants';

const MAX_FILE_LIST_COUNT = 100; 				// Maximum number of files to include in the file structure overview
const MAX_SOURCE_FILES = 25; 					// Maximum number of important source files to sample
const MAX_SOURCE_FILE_CONTENT_LENGTH = 1200; 	// Maximum characters to sample from each source file
const MAX_CONFIG_FILES = 10; 					// Maximum number of configuration files to include
const MAX_CONFIG_FILE_CONTENT_LENGTH = 2000; 	// Maximum characters to sample from each configuration file
const MAX_TEST_FILES = 5; 						// Maximum number of test files to include
const MAX_TEST_FILE_CONTENT_LENGTH = 800; 		// Maximum characters to sample from each test file
const MAX_CI_FILE_CONTENT_LENGTH = 600; 		// Maximum characters to sample from each CI/CD configuration file
const MAX_README_CONTENT_LENGTH = 4000; 		// Maximum characters to include from README file

/**
 * Generate comprehensive single-stage AI analysis prompt
 * AI analyzes everything in one go - more accurate and efficient
 */
export function generateComprehensiveAnalysisPrompt(snapshot: RepoSnapshot): string {
	const { metadata, files, readme} = snapshot;

	// Get file structure overview
	const fileList = files
		.slice(0, MAX_FILE_LIST_COUNT)
		.map(f => `- ${f.path} (${f.lines} lines, ${f.size} bytes)`)
		.join('\n');

	// Get sample code from important files
	const sampleFiles = files
		.filter(f => {
			// Prioritize important files
			const name = f.path.toLowerCase();
			return (
				name.includes('src/') ||
				name.includes('lib/') ||
				name.includes('app/') ||
				name.endsWith('.ts') ||
				name.endsWith('.tsx') ||
				name.endsWith('.js') ||
				name.endsWith('.jsx') ||
				name.endsWith('.py') ||
				name.endsWith('.java') ||
				name.endsWith('.go') ||
				name.endsWith('.rs')
			);
		})
		.filter(f => !f.path.includes('node_modules'))
		.filter(f => !f.path.includes('.min.'))
		.slice(0, MAX_SOURCE_FILES)
		.map(f => `### ${f.path}\n\`\`\`\n${f.content.slice(0, MAX_SOURCE_FILE_CONTENT_LENGTH)}\n\`\`\``)
		.join('\n\n');

	// Get config files (package.json, tsconfig.json, etc.)
	const configFiles = files
		.filter(f => {
			const name = f.path.toLowerCase();
			return (
				name === 'package.json' ||
				name === 'tsconfig.json' ||
				name === 'pyproject.toml' ||
				name === 'cargo.toml' ||
				name === 'go.mod' ||
				name === 'pom.xml' ||
				name === 'build.gradle' ||
				name === 'composer.json' ||
				name === 'requirements.txt' ||
				name.includes('config') && name.endsWith('.json')
			);
		})
		.slice(0, MAX_CONFIG_FILES)
		.map(f => `### ${f.path}\n\`\`\`\n${f.content.slice(0, MAX_CONFIG_FILE_CONTENT_LENGTH)}\n\`\`\``)
		.join('\n\n');

	// Get test files
	const testFiles = files
		.filter(f => {
			const name = f.path.toLowerCase();
			return (
				name.includes('test') ||
				name.includes('spec') ||
				name.includes('__tests__')
			);
		})
		.slice(0, MAX_TEST_FILES)
		.map(f => `### ${f.path}\n\`\`\`\n${f.content.slice(0, MAX_TEST_FILE_CONTENT_LENGTH)}\n\`\`\``)
		.join('\n\n');

	// Get CI/CD files
	const ciFiles = files
		.filter(f => {
			const name = f.path.toLowerCase();
			return (
				name.includes('.github/workflows') ||
				name.includes('.gitlab-ci') ||
				name.includes('.travis') ||
				name.includes('jenkinsfile') ||
				name.includes('.circleci')
			);
		})
		.map(f => `### ${f.path}\n\`\`\`\n${f.content.slice(0, MAX_CI_FILE_CONTENT_LENGTH)}\n\`\`\``)
		.join('\n\n');

	return `You are an expert software architect and code analyst. Analyze this Git repository comprehensively and provide detailed insights.

## Repository Information
- **Repository**: ${metadata.fullName}
- **URL**: ${metadata.url}
- **Provider**: ${metadata.provider}
- **Branch**: ${metadata.branch}
- **Total Files**: ${files.length}
${metadata.stars !== null ? `- **Stars**: ${metadata.stars}` : ''}
${metadata.forks !== null ? `- **Forks**: ${metadata.forks}` : ''}

${readme ? `## README\n\`\`\`markdown\n${readme.slice(0, MAX_README_CONTENT_LENGTH)}\n\`\`\`\n` : ''}

## File Structure Overview
${fileList}

${configFiles ? `## Configuration Files\n${configFiles}\n` : ''}

## Source Code Samples (Top 25 Files)
${sampleFiles}

${testFiles ? `## Test Files\n${testFiles}\n` : ''}

${ciFiles ? `## CI/CD Configuration\n${ciFiles}\n` : ''}

---

## Your Task

Analyze this repository **thoroughly** and provide a comprehensive JSON response. **Think like a senior developer** - don't just look at file extensions, understand the actual code and project structure.

### Analysis Instructions:

1. **Understand the Project**:
   - Read the README carefully
   - Examine the actual source code, not just filenames
   - Look at package.json scripts to understand the build process
   - Check CI/CD configs to understand deployment

2. **Detect Technology Stack**:
   - Identify technologies **actually used** in the code
   - Don't just list everything in package.json - check if it's actually imported
   - Determine versions from config files

3. **Analyze File Statistics**:
   - Count ONLY source code files (exclude images, audio, video, fonts, binaries, etc.)
   - Count files by **actual language used**, not just extensions
   - For example, .ts files might be config files, not TypeScript code
   - Ignore generated/minified files
   - Calculate total lines of actual source code
   - **IMPORTANT**: totalLines MUST equal the sum of all values in languageBreakdown
   - Double-check: sum(languageBreakdown values) = totalLines

4. **Examine Project Structure**:
   - Check if tests **actually exist and are meaningful**
   - Verify CI/CD is **configured and active**, not just present
   - Look at package.json scripts to find the real package manager (npm/yarn/pnpm)
   - Detect build tools from **actual usage**, not just config file presence

5. **Assess Code Quality**:
   - Look for best practices, patterns, error handling
   - Check test coverage indicators
   - Evaluate code organization and architecture
   - For issues: Only list REAL problems you can identify. If code quality is good, use empty array []
   - Don't fabricate issues - it's OK to have no issues if the code is well-written

6. **Determine Complexity & Skill Level**:
   - Consider architectural patterns used
   - Evaluate advanced concepts (concurrency, distributed systems, etc.)
   - Assess required knowledge depth
   - Be realistic - not everything is "senior level"

---

## Required JSON Response

Return **ONLY** this JSON object (no markdown, no extra text):

{
  "description": "2-3 detailed sentences explaining what this project does, its main purpose, and key features. Be specific.",
  
  "primaryLanguage": "The main programming language (based on actual code, not file count)",
  
  "techStack": [
    {
      "name": "Technology name (e.g., React, TypeScript, PostgreSQL)",
      "category": "language|framework|library|tool|platform|database|other",
      "version": "version string or null"
    }
  ],
  
  "fileStats": {
    "totalFiles": 123,
    "totalLines": 12345,
    "languageBreakdown": {
      "TypeScript": 5000,
      "JavaScript": 3000,
      "CSS": 1000
    }
    // NOTE: totalLines MUST equal sum of languageBreakdown values (5000 + 3000 + 1000 = 9000)
    // Only count source code files, exclude media files, binaries, fonts, etc.
  },
  
  "structure": {
    "hasTests": true,
    "hasCI": false,
    "hasDocumentation": true,
    "hasLicense": true,
    "packageManagers": ["pnpm"],
    "buildTools": ["vite", "typescript"],
    "dockerized": false,
    "monorepo": false
  },
  
  "codeQuality": {
    "score": 85,
    "issues": [],
    "strengths": [
      "Strength 1",
      "Strength 2"
    ]
    // NOTE: issues can be an empty array [] if no significant problems are found
    // Only include real issues, don't fabricate problems just to fill the array
  },
  
  "skillLevel": "mid-level",
  
  "skillLevelRationale": "Explanation of why this skill level is required.",
  
  "complexity": {
    "score": 70,
    "factors": [
      "Factor 1",
      "Factor 2"
    ]
  }
}

**CRITICAL**: 
- Return ONLY the JSON object
- No markdown code blocks around it
- No explanatory text before or after
- Be honest and accurate - analyze the actual code, not assumptions
- Provide specific evidence for your assessments
`;
}
