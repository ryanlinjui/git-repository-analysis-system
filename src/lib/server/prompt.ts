import type { RepoSnapshot } from './types';

/**
 * Generate analysis prompt for AI
 */
export function generateAnalysisPrompt(snapshot: RepoSnapshot): string {
	const { metadata, files, structure, languageBreakdown, readme, packageJson } = snapshot;

	// Get top 10 files by size
	const topFiles = files
		.sort((a, b) => b.size - a.size)
		.slice(0, 10)
		.map(f => ({ path: f.path, size: f.size, lines: f.lines }));

	return `You are an expert code analyst. Analyze this Git repository and provide a comprehensive analysis in JSON format.

Repository: ${metadata.fullName}
URL: ${metadata.url}
Branch: ${metadata.branch}
Stars: ${metadata.stars || 'N/A'}
Forks: ${metadata.forks || 'N/A'}

## Repository Structure
- Total Files: ${structure.totalFiles}
- Has Tests: ${structure.hasTests}
- Has CI/CD: ${structure.hasCI}
- Has Documentation: ${structure.hasDocumentation}
- Has License: ${structure.hasLicense}
- Package Managers: ${structure.packageManagers.join(', ') || 'None detected'}
- Build Tools: ${structure.buildTools.join(', ') || 'None detected'}
- Dockerized: ${structure.dockerized}
- Monorepo: ${structure.monorepo}

## Language Breakdown (lines of code)
${Object.entries(languageBreakdown)
	.map(([lang, lines]) => `- ${lang}: ${lines}`)
	.join('\n')}

## Top 10 Largest Files
${topFiles.map(f => `- ${f.path} (${f.size} bytes, ${f.lines} lines)`).join('\n')}

${readme ? `## README\n\`\`\`\n${readme.slice(0, 2000)}\n\`\`\`\n` : ''}

${packageJson ? `## package.json\n\`\`\`json\n${JSON.stringify(packageJson, null, 2).slice(0, 1000)}\n\`\`\`\n` : ''}

## Sample Files
${files
	.slice(0, 5)
	.map(
		f => `### ${f.path}
\`\`\`
${f.content.slice(0, 500)}
\`\`\`
`
	)
	.join('\n')}

Please provide your analysis in the following JSON format:
{
  "description": "A comprehensive 2-3 sentence description of what this project does",
  "techStack": [
    {
      "name": "Technology name",
      "category": "language|framework|library|tool|platform|database|other",
      "version": "version if detected or null",
      "confidence": 0-100
    }
  ],
  "primaryLanguage": "The main programming language used",
  "skillLevel": "beginner|junior|mid-level|senior",
  "skillLevelRationale": "Brief explanation of why this skill level was chosen",
  "codeQuality": {
    "score": 0-100,
    "issues": ["List of potential issues"],
    "strengths": ["List of project strengths"]
  },
  "complexity": {
    "score": 0-100,
    "factors": ["Factors contributing to complexity"]
  }
}

IMPORTANT: Return ONLY the JSON object, no additional text or markdown formatting.`;
}
