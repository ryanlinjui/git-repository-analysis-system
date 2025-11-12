#!/usr/bin/env tsx

/**
 * Repository Analysis Script
 * 
 * Usage: pnpm analyze <repo-url>
 * Example: pnpm analyze https://github.com/facebook/react
 */

import { config } from 'dotenv';
import { analyzeRepository } from '../src/lib/server/analyzer';

// Load environment variables
config();

async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.error('❌ Error: Please provide a repository URL');
		console.log('\nUsage: pnpm analyze <repo-url>');
		console.log('Example: pnpm analyze https://github.com/facebook/react');
		process.exit(1);
	}

	const repoUrl = args[0];
	const geminiApiKey = process.env.GOOGLE_GENAI_API_KEY;

	if (!geminiApiKey) {
		console.error('❌ Error: GOOGLE_GENAI_API_KEY environment variable is not set');
		console.log('\nPlease set your Gemini API key in .env file:');
		console.log('GOOGLE_GENAI_API_KEY="your-api-key-here"');
		process.exit(1);
	}

	console.log('🚀 Starting repository analysis...');
	console.log(`📍 Repository: ${repoUrl}`);
	console.log('');

	try {
		const startTime = Date.now();
		
		// Progress bar
		let currentProgress = 0;
		const progressBar = (progress: number, message: string) => {
			currentProgress = progress;
			const barLength = 40;
			const filled = Math.round((progress / 100) * barLength);
			const empty = barLength - filled;
			const bar = '█'.repeat(filled) + '░'.repeat(empty);
			const percentage = progress.toString().padStart(3, ' ');
			
			// Clear line and print progress
			process.stdout.write(`\r[${bar}] ${percentage}% - ${message}`);
			
			if (progress === 100) {
				console.log(''); // New line when complete
			}
		};

		const result = await analyzeRepository(repoUrl, geminiApiKey, progressBar);
		const duration = ((Date.now() - startTime) / 1000).toFixed(2);

		console.log('\n' + '='.repeat(80));
		console.log('📋 ANALYSIS RESULT');
		console.log('='.repeat(80));
		console.log(JSON.stringify(result, null, 2));
		console.log('='.repeat(80));
		console.log(`\n⏱️  Analysis completed in ${duration}s`);
		console.log('✨ Done!');
	} catch (error) {
		console.error('\n❌ Analysis failed:', error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

main();
